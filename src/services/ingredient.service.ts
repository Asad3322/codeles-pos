import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Ingredient, type IIngredient } from "@/models/Ingredient";
import { IngredientStockLog } from "@/models/IngredientStockLog";
import { Notification } from "@/models/Notification";
import {
  toBaseUnits,
  BASE_UNITS,
  generateIngredientCode,
  type UnitFamily,
  type DisplayUnit,
} from "@/lib/unit-conversion";
import { IngredientRepository, type IngredientFilterParams } from "@/repositories/ingredient.repository";
import type { IngredientInput, IngredientAdjustInput } from "@/validations/ingredient.schema";

const repo = new IngredientRepository();

export class IngredientService {
  async list(params: IngredientFilterParams) {
    await connectDB();
    return repo.paginate(params);
  }

  async getById(id: string) {
    await connectDB();
    const ingredient = await repo.findById(id);
    if (!ingredient) throw new Error("Ingredient not found");

    const logs = await IngredientStockLog.find({ ingredientId: id })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return { ingredient, logs };
  }

  async create(data: IngredientInput, userId: string) {
    await connectDB();

    const unitFamily = data.unitFamily as UnitFamily;
    const baseUnit = BASE_UNITS[unitFamily];

    // Generate unique code if not provided
    let code = data.code?.trim().toUpperCase();
    if (!code) {
      let candidate = generateIngredientCode("ING", data.name);
      let attempts = 0;
      while ((await Ingredient.exists({ code: candidate })) && attempts < 10) {
        candidate = generateIngredientCode("ING", data.name);
        attempts++;
      }
      code = candidate;
    } else {
      const existing = await Ingredient.exists({ code });
      if (existing) {
        throw new Error(`Ingredient code '${code}' already exists`);
      }
    }

    // Convert opening stock
    const openingUnit = data.openingStockUnit || data.defaultDisplayUnit;
    const { quantityInBaseUnit: openingStockInBaseUnit } = toBaseUnits(
      data.openingStock || 0,
      openingUnit,
      unitFamily,
      data.openingStockConversionFactor
    );

    // Convert minimum stock threshold
    const minUnit = data.minimumStockUnit || data.defaultDisplayUnit;
    const { quantityInBaseUnit: minimumStockInBaseUnit } = toBaseUnits(
      data.minimumStock || 0,
      minUnit,
      unitFamily
    );

    // Initial average cost per base unit
    let averageCostPerBaseUnit = 0;
    if (data.initialCost > 0) {
      const { quantityInBaseUnit: oneDisplayUnitInBase } = toBaseUnits(
        1,
        data.defaultDisplayUnit,
        unitFamily
      );
      if (oneDisplayUnitInBase > 0) {
        averageCostPerBaseUnit = data.initialCost / oneDisplayUnitInBase;
      }
    }

    const ingredient = await Ingredient.create({
      name: data.name.trim(),
      code,
      category: data.category,
      unitFamily,
      baseUnit,
      defaultDisplayUnit: data.defaultDisplayUnit as DisplayUnit,
      stockInBaseUnit: openingStockInBaseUnit,
      minimumStockInBaseUnit,
      averageCostPerBaseUnit,
      preferredSupplierId: data.preferredSupplierId
        ? new mongoose.Types.ObjectId(data.preferredSupplierId)
        : undefined,
      branchId: data.branchId ? new mongoose.Types.ObjectId(data.branchId) : undefined,
      notes: data.notes?.trim(),
      isActive: true,
    });

    // If opening stock > 0, create opening_stock log
    if (openingStockInBaseUnit > 0) {
      await IngredientStockLog.create({
        ingredientId: ingredient._id,
        type: "opening_stock",
        quantityInBaseUnit: openingStockInBaseUnit,
        previousStockInBaseUnit: 0,
        newStockInBaseUnit: openingStockInBaseUnit,
        baseUnit,
        reason: "Initial opening stock upon ingredient registration",
        branchId: ingredient.branchId,
        createdBy: new mongoose.Types.ObjectId(userId),
      });
    }

    return ingredient;
  }

  async update(id: string, data: Partial<IngredientInput>) {
    await connectDB();
    const ingredient = await Ingredient.findById(id);
    if (!ingredient) throw new Error("Ingredient not found");

    if (data.name) ingredient.name = data.name.trim();
    if (data.category) ingredient.category = data.category;
    if (data.defaultDisplayUnit) ingredient.defaultDisplayUnit = data.defaultDisplayUnit as DisplayUnit;
    if (data.notes !== undefined) ingredient.notes = data.notes.trim();

    if (data.minimumStock !== undefined) {
      const minUnit = data.minimumStockUnit || ingredient.defaultDisplayUnit;
      const { quantityInBaseUnit } = toBaseUnits(
        data.minimumStock,
        minUnit,
        ingredient.unitFamily
      );
      ingredient.minimumStockInBaseUnit = quantityInBaseUnit;
    }

    if (data.preferredSupplierId !== undefined) {
      ingredient.preferredSupplierId = data.preferredSupplierId
        ? new mongoose.Types.ObjectId(data.preferredSupplierId)
        : undefined;
    }

    await ingredient.save();
    return ingredient;
  }

  async adjustStock(id: string, data: IngredientAdjustInput, userId: string) {
    await connectDB();
    const ingredient = await Ingredient.findById(id);
    if (!ingredient) throw new Error("Ingredient not found");

    const { quantityInBaseUnit: deltaBase } = toBaseUnits(
      data.quantity,
      data.unit,
      ingredient.unitFamily,
      data.conversionFactor
    );

    const previousStock = ingredient.stockInBaseUnit;
    let newStock = previousStock;
    let effectiveChange = 0;

    if (data.adjustmentType === "add") {
      newStock = previousStock + deltaBase;
      effectiveChange = deltaBase;
    } else if (data.adjustmentType === "subtract") {
      newStock = previousStock - deltaBase;
      effectiveChange = -deltaBase;
    } else if (data.adjustmentType === "set") {
      newStock = deltaBase;
      effectiveChange = deltaBase - previousStock;
    }

    if (newStock < 0) {
      throw new Error(`Stock cannot be negative. Current stock is ${previousStock} ${ingredient.baseUnit}`);
    }

    ingredient.stockInBaseUnit = newStock;
    await ingredient.save();

    const log = await IngredientStockLog.create({
      ingredientId: ingredient._id,
      type: "adjustment",
      quantityInBaseUnit: effectiveChange,
      previousStockInBaseUnit: previousStock,
      newStockInBaseUnit: newStock,
      baseUnit: ingredient.baseUnit,
      referenceType: "adjustment",
      reason: data.reason,
      notes: data.notes,
      branchId: ingredient.branchId,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    // Check low stock alert
    if (newStock <= ingredient.minimumStockInBaseUnit) {
      await Notification.create({
        title: "Low Ingredient Stock",
        message: `${ingredient.name} is low on stock (${newStock} ${ingredient.baseUnit} remaining)`,
        type: "low_stock",
        branchId: ingredient.branchId,
        link: "/ingredients",
      });
    }

    return { ingredient, log };
  }

  async softDelete(id: string) {
    await connectDB();
    const ingredient = await Ingredient.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!ingredient) throw new Error("Ingredient not found");
    return ingredient;
  }

  async getLowStock(branchId?: string) {
    await connectDB();
    return repo.getLowStock(branchId);
  }
}
