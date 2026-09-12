import { z } from "zod";

export const purchaseItemSchema = z.object({
  itemType: z.enum(["ingredient", "product"]).default("ingredient"),
  ingredientId: z.string().optional(),
  productId: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  conversionFactor: z.number().min(0.0001).optional(),
  unitCost: z.number().min(0, "Cost must be 0 or greater"),
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  branchId: z.string().optional().nullable(),
  purchaseDate: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one purchase item is required"),
  taxRate: z.number().min(0).max(100).default(0).optional(),
  paid: z.number().min(0).default(0).optional(),
  notes: z.string().optional(),
});

export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
export type PurchaseInput = z.infer<typeof purchaseSchema>;
