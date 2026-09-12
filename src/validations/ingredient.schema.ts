import { z } from "zod";
import { INGREDIENT_CATEGORIES } from "@/lib/unit-conversion";

export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required").trim(),
  code: z.string().optional(),
  category: z.enum(INGREDIENT_CATEGORIES, {
    error: "Please select a valid category",
  }),
  unitFamily: z.enum(["weight", "volume", "count"], {
    error: "Unit family is required",
  }),
  defaultDisplayUnit: z.enum(["kg", "g", "liter", "ml", "pcs", "dozen", "box", "pack"], {
    error: "Default display unit is required",
  }),
  openingStock: z.number().min(0).default(0),
  openingStockUnit: z.string().optional(),
  openingStockConversionFactor: z.number().min(0.0001).optional(),
  minimumStock: z.number().min(0).default(0),
  minimumStockUnit: z.string().optional(),
  initialCost: z.number().min(0).default(0), // Cost per display unit (or opening stock unit)
  preferredSupplierId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export const ingredientAdjustSchema = z.object({
  adjustmentType: z.enum(["add", "subtract", "set"]),
  quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  conversionFactor: z.number().min(0.0001).optional(),
  reason: z.enum(["physical_count", "damage", "expired", "opening_stock", "correction"], {
    error: "Valid reason is required",
  }),
  notes: z.string().optional(),
});

export type IngredientInput = z.infer<typeof ingredientSchema>;
export type IngredientAdjustInput = z.infer<typeof ingredientAdjustSchema>;
