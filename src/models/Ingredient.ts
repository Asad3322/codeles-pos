import mongoose, { Schema, type Document, type Model } from "mongoose";
import {
  INGREDIENT_CATEGORIES,
  type IngredientCategory,
  type UnitFamily,
  type BaseUnit,
  type DisplayUnit,
} from "@/lib/unit-conversion";

export { INGREDIENT_CATEGORIES, type IngredientCategory };

export interface IIngredient extends Document {
  name: string;
  code: string;
  category: IngredientCategory;
  unitFamily: UnitFamily;
  baseUnit: BaseUnit;
  defaultDisplayUnit: DisplayUnit;
  stockInBaseUnit: number;
  minimumStockInBaseUnit: number;
  averageCostPerBaseUnit: number;
  preferredSupplierId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<IIngredient>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: INGREDIENT_CATEGORIES,
      default: "Other",
    },
    unitFamily: {
      type: String,
      enum: ["weight", "volume", "count"],
      required: true,
    },
    baseUnit: {
      type: String,
      enum: ["g", "ml", "pcs"],
      required: true,
    },
    defaultDisplayUnit: {
      type: String,
      enum: ["kg", "g", "liter", "ml", "pcs", "dozen", "box", "pack"],
      required: true,
    },
    stockInBaseUnit: { type: Number, required: true, default: 0, min: 0 },
    minimumStockInBaseUnit: { type: Number, required: true, default: 0, min: 0 },
    averageCostPerBaseUnit: { type: Number, required: true, default: 0, min: 0 },
    preferredSupplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

IngredientSchema.index({ name: "text", code: "text" });
IngredientSchema.index({ category: 1, isActive: 1 });
IngredientSchema.index({ isActive: 1, stockInBaseUnit: 1, minimumStockInBaseUnit: 1 });
IngredientSchema.index({ branchId: 1 });

export const Ingredient: Model<IIngredient> =
  mongoose.models.Ingredient ?? mongoose.model<IIngredient>("Ingredient", IngredientSchema);
