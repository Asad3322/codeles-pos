import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Purchase, type IPurchaseItem } from "@/models/Purchase";
import { Ingredient, type IIngredient } from "@/models/Ingredient";
import { Product } from "@/models/Product";
import { Supplier } from "@/models/Supplier";
import { IngredientStockLog } from "@/models/IngredientStockLog";
import { InventoryLog } from "@/models/InventoryLog";
import { toBaseUnits } from "@/lib/unit-conversion";
import { generateInvoiceNumber } from "@/lib/utils";
import { PurchaseRepository } from "@/repositories/purchase.repository";
import type { PurchaseInput } from "@/validations/purchase.schema";

const repo = new PurchaseRepository();

interface ResolvedIngredientUpdate {
  ingredientId: string;
  previousStock: number;
  newStock: number;
  previousAvgCost: number;
  newAvgCost: number;
  quantityInBaseUnit: number;
  baseUnit: string;
  costPerBaseUnit: number;
}

interface ResolvedProductUpdate {
  productId: string;
  previousStock: number;
  quantity: number;
}

export class PurchaseService {
  async list(params: { page?: number; limit?: number; search?: string }) {
    await connectDB();
    return repo.paginate(params);
  }

  async getById(id: string) {
    await connectDB();
    const purchase = await repo.findById(id);
    if (!purchase) throw new Error("Purchase not found");
    return purchase;
  }

  async createPurchase(data: PurchaseInput, userId: string) {
    await connectDB();

    // 1. Verify supplier exists
    const supplier = await Supplier.findById(data.supplierId);
    if (!supplier) throw new Error("Supplier not found");

    // 2. Pre-resolve and validate all items before database mutations
    const resolvedIngredientUpdates: ResolvedIngredientUpdate[] = [];
    const resolvedProductUpdates: ResolvedProductUpdate[] = [];
    const purchaseItems: IPurchaseItem[] = [];

    let calculatedSubtotal = 0;

    for (const item of data.items) {
      if (item.itemType === "ingredient") {
        if (!item.ingredientId) {
          throw new Error(`Ingredient reference missing for item '${item.name}'`);
        }
        const ing = await Ingredient.findById(item.ingredientId);
        if (!ing || !ing.isActive) {
          throw new Error(`Ingredient '${item.name}' not found or inactive`);
        }

        // Validate unit compatibility and convert to base units
        const { quantityInBaseUnit, conversionFactor } = toBaseUnits(
          item.quantity,
          item.unit,
          ing.unitFamily,
          item.conversionFactor
        );

        const lineSubtotal = item.quantity * item.unitCost;
        calculatedSubtotal += lineSubtotal;

        const costPerBaseUnit = lineSubtotal / quantityInBaseUnit;

        // Weighted Average Cost calculation
        const currentStock = ing.stockInBaseUnit;
        const currentAvgCost = ing.averageCostPerBaseUnit || 0;
        const newStock = currentStock + quantityInBaseUnit;

        let newAvgCost = costPerBaseUnit;
        if (currentStock > 0 && newStock > 0) {
          newAvgCost =
            (currentStock * currentAvgCost + quantityInBaseUnit * costPerBaseUnit) /
            newStock;
        }

        resolvedIngredientUpdates.push({
          ingredientId: ing._id.toString(),
          previousStock: currentStock,
          newStock,
          previousAvgCost: currentAvgCost,
          newAvgCost,
          quantityInBaseUnit,
          baseUnit: ing.baseUnit,
          costPerBaseUnit,
        });

        purchaseItems.push({
          itemType: "ingredient",
          ingredientId: ing._id,
          nameSnapshot: ing.name,
          purchaseQuantity: item.quantity,
          purchaseUnit: item.unit,
          conversionFactor,
          quantityInBaseUnit,
          unitCost: item.unitCost,
          costPerBaseUnit,
          subtotal: lineSubtotal,
        });
      } else if (item.itemType === "product") {
        if (!item.productId) {
          throw new Error(`Product reference missing for item '${item.name}'`);
        }
        const prod = await Product.findById(item.productId);
        if (!prod || !prod.isActive) {
          throw new Error(`Product '${item.name}' not found or inactive`);
        }

        const lineSubtotal = item.quantity * item.unitCost;
        calculatedSubtotal += lineSubtotal;

        resolvedProductUpdates.push({
          productId: prod._id.toString(),
          previousStock: prod.stock,
          quantity: item.quantity,
        });

        purchaseItems.push({
          itemType: "product",
          productId: prod._id,
          nameSnapshot: prod.name,
          purchaseQuantity: item.quantity,
          purchaseUnit: item.unit || "pcs",
          conversionFactor: 1,
          quantityInBaseUnit: item.quantity,
          unitCost: item.unitCost,
          costPerBaseUnit: item.unitCost,
          subtotal: lineSubtotal,
        });
      }
    }

    const taxAmount = (calculatedSubtotal * (data.taxRate || 0)) / 100;
    const grandTotal = calculatedSubtotal + taxAmount;
    const paidAmount = Math.min(grandTotal, Math.max(0, data.paid || 0));

    // 3. Create Purchase record in "processing" state
    const purchaseNumber = generateInvoiceNumber("PUR");
    const purchase = await Purchase.create({
      purchaseNumber,
      supplierId: supplier._id,
      items: purchaseItems,
      subtotal: calculatedSubtotal,
      tax: taxAmount,
      total: grandTotal,
      paid: paidAmount,
      status: "processing",
      branchId: data.branchId ? new mongoose.Types.ObjectId(data.branchId) : undefined,
      createdBy: new mongoose.Types.ObjectId(userId),
      notes: data.notes?.trim(),
      receivedAt: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
    });

    // 4. Apply inventory updates with structured rollback handling
    const appliedIngredientRollbacks: { ingredientId: string; prevStock: number; prevCost: number }[] = [];
    const appliedProductRollbacks: { productId: string; prevStock: number }[] = [];

    try {
      // Update Ingredients
      for (const update of resolvedIngredientUpdates) {
        await Ingredient.findByIdAndUpdate(update.ingredientId, {
          $set: {
            stockInBaseUnit: update.newStock,
            averageCostPerBaseUnit: update.newAvgCost,
          },
        });

        appliedIngredientRollbacks.push({
          ingredientId: update.ingredientId,
          prevStock: update.previousStock,
          prevCost: update.previousAvgCost,
        });

        await IngredientStockLog.create({
          ingredientId: new mongoose.Types.ObjectId(update.ingredientId),
          type: "purchase",
          quantityInBaseUnit: update.quantityInBaseUnit,
          previousStockInBaseUnit: update.previousStock,
          newStockInBaseUnit: update.newStock,
          baseUnit: update.baseUnit,
          referenceType: "purchase",
          referenceId: purchaseNumber,
          purchaseId: purchase._id,
          branchId: purchase.branchId,
          createdBy: new mongoose.Types.ObjectId(userId),
        });
      }

      // Update Legacy/Resale Products if any
      for (const update of resolvedProductUpdates) {
        await Product.findByIdAndUpdate(update.productId, {
          $inc: { stock: update.quantity },
        });

        appliedProductRollbacks.push({
          productId: update.productId,
          prevStock: update.previousStock,
        });

        await InventoryLog.create({
          productId: new mongoose.Types.ObjectId(update.productId),
          type: "purchase",
          quantity: update.quantity,
          previousStock: update.previousStock,
          newStock: update.previousStock + update.quantity,
          reference: purchaseNumber,
          branchId: purchase.branchId,
          createdBy: new mongoose.Types.ObjectId(userId),
        });
      }

      // 5. Update Supplier Balance
      const balanceDue = grandTotal - paidAmount;
      await Supplier.findByIdAndUpdate(supplier._id, {
        $inc: {
          dueBalance: balanceDue,
          totalPaid: paidAmount,
        },
      });

      // 6. Mark Purchase completed
      purchase.status = "completed";
      await purchase.save();

      return purchase;
    } catch (err) {
      // Compensating Rollback
      console.error("Purchase processing failed, initiating rollback:", err);

      for (const rb of appliedIngredientRollbacks) {
        try {
          await Ingredient.findByIdAndUpdate(rb.ingredientId, {
            $set: {
              stockInBaseUnit: rb.prevStock,
              averageCostPerBaseUnit: rb.prevCost,
            },
          });
        } catch (rbErr) {
          console.error(`Rollback failed for ingredient ${rb.ingredientId}:`, rbErr);
        }
      }

      for (const rb of appliedProductRollbacks) {
        try {
          await Product.findByIdAndUpdate(rb.productId, {
            $set: { stock: rb.prevStock },
          });
        } catch (rbErr) {
          console.error(`Rollback failed for product ${rb.productId}:`, rbErr);
        }
      }

      // Clean up orphaned logs
      await IngredientStockLog.deleteMany({ purchaseId: purchase._id });
      await InventoryLog.deleteMany({ reference: purchaseNumber });

      purchase.status = "failed";
      purchase.errorMessage = err instanceof Error ? err.message : "Execution failed";
      await purchase.save();

      throw err;
    }
  }
}
