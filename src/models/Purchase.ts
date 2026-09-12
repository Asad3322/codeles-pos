import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PurchaseStatus =
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "pending"
  | "received"
  | "returned";

export interface IPurchaseItem {
  itemType: "ingredient" | "product";
  ingredientId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  nameSnapshot: string;
  purchaseQuantity: number;
  purchaseUnit: string;
  conversionFactor: number;
  quantityInBaseUnit: number;
  unitCost: number;
  costPerBaseUnit: number;
  subtotal: number;
}

export interface IPurchase extends Document {
  purchaseNumber: string;
  supplierId: mongoose.Types.ObjectId;
  items: IPurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  status: PurchaseStatus;
  errorMessage?: string;
  branchId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  notes?: string;
  receivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>({
  itemType: {
    type: String,
    enum: ["ingredient", "product"],
    default: "ingredient",
  },
  ingredientId: { type: Schema.Types.ObjectId, ref: "Ingredient" },
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  nameSnapshot: { type: String, required: true },
  purchaseQuantity: { type: Number, required: true, min: 0.0001 },
  purchaseUnit: { type: String, required: true },
  conversionFactor: { type: Number, default: 1 },
  quantityInBaseUnit: { type: Number, required: true, min: 0.0001 },
  unitCost: { type: Number, required: true, min: 0 },
  costPerBaseUnit: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
});

const PurchaseSchema = new Schema<IPurchase>(
  {
    purchaseNumber: { type: String, required: true, unique: true },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    items: [PurchaseItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    paid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        "processing",
        "completed",
        "failed",
        "cancelled",
        "pending",
        "received",
        "returned",
      ],
      default: "processing",
    },
    errorMessage: String,
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: String,
    receivedAt: Date,
  },
  { timestamps: true }
);

PurchaseSchema.index({ supplierId: 1, createdAt: -1 });
PurchaseSchema.index({ status: 1, createdAt: -1 });

export const Purchase: Model<IPurchase> =
  mongoose.models.Purchase ??
  mongoose.model<IPurchase>("Purchase", PurchaseSchema);
