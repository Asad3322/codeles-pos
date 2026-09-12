import mongoose, { Schema, type Document, type Model } from "mongoose";

export type IngredientStockLogType =
  | "purchase"
  | "adjustment"
  | "production"
  | "wastage"
  | "return"
  | "opening_stock";

export interface IIngredientStockLog extends Document {
  ingredientId: mongoose.Types.ObjectId;
  type: IngredientStockLogType;
  quantityInBaseUnit: number;
  previousStockInBaseUnit: number;
  newStockInBaseUnit: number;
  baseUnit: string;
  referenceType?: "purchase" | "adjustment" | "manual" | "production";
  referenceId?: string;
  purchaseId?: mongoose.Types.ObjectId;
  reason?: string;
  notes?: string;
  branchId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const IngredientStockLogSchema = new Schema<IIngredientStockLog>(
  {
    ingredientId: { type: Schema.Types.ObjectId, ref: "Ingredient", required: true },
    type: {
      type: String,
      enum: ["purchase", "adjustment", "production", "wastage", "return", "opening_stock"],
      required: true,
    },
    quantityInBaseUnit: { type: Number, required: true },
    previousStockInBaseUnit: { type: Number, required: true },
    newStockInBaseUnit: { type: Number, required: true },
    baseUnit: { type: String, required: true },
    referenceType: String,
    referenceId: String,
    purchaseId: { type: Schema.Types.ObjectId, ref: "Purchase" },
    reason: String,
    notes: String,
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

IngredientStockLogSchema.index({ ingredientId: 1, createdAt: -1 });
IngredientStockLogSchema.index({ type: 1, createdAt: -1 });
IngredientStockLogSchema.index({ purchaseId: 1 });

export const IngredientStockLog: Model<IIngredientStockLog> =
  mongoose.models.IngredientStockLog ??
  mongoose.model<IIngredientStockLog>("IngredientStockLog", IngredientStockLogSchema);
