"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { purchaseSchema, type PurchaseInput } from "@/validations/purchase.schema";
import { formatCurrency } from "@/lib/utils";
import { STANDARD_CONVERSIONS } from "@/lib/unit-conversion";

interface SupplierOption {
  _id: string;
  name: string;
  company?: string;
}

interface IngredientOption {
  _id: string;
  name: string;
  code: string;
  category: string;
  unitFamily: string;
  defaultDisplayUnit: string;
  averageCostPerBaseUnit: number;
}

interface ProductOption {
  _id: string;
  name: string;
  sku: string;
  costPrice: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PurchaseFormDialog({ open, onOpenChange, onSuccess }: Props) {
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseInput>({
    resolver: zodResolver(purchaseSchema) as never,
    defaultValues: {
      supplierId: "",
      purchaseDate: new Date().toISOString().slice(0, 10),
      taxRate: 0,
      paid: 0,
      notes: "",
      items: [
        {
          itemType: "ingredient",
          ingredientId: "",
          name: "",
          quantity: 1,
          unit: "kg",
          unitCost: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items") || [];
  const watchedTaxRate = watch("taxRate") || 0;
  const watchedPaid = watch("paid") || 0;

  useEffect(() => {
    if (open) {
      // Load suppliers
      fetch("/api/suppliers")
        .then((r) => r.json())
        .then((json) => {
          if (json?.success && Array.isArray(json.data?.items)) {
            setSuppliers(json.data.items);
          }
        })
        .catch(() => {});

      // Load ingredients
      fetch("/api/ingredients?limit=200")
        .then((r) => r.json())
        .then((json) => {
          if (json?.success && Array.isArray(json.data?.items)) {
            setIngredients(json.data.items);
          }
        })
        .catch(() => {});

      // Load products (resale items)
      fetch("/api/products?limit=200")
        .then((r) => r.json())
        .then((json) => {
          if (json?.success && Array.isArray(json.data?.items)) {
            setProducts(json.data.items);
          }
        })
        .catch(() => {});

      reset({
        supplierId: "",
        purchaseDate: new Date().toISOString().slice(0, 10),
        taxRate: 0,
        paid: 0,
        notes: "",
        items: [
          {
            itemType: "ingredient",
            ingredientId: "",
            name: "",
            quantity: 1,
            unit: "kg",
            unitCost: 0,
          },
        ],
      });
    }
  }, [open, reset]);

  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0
  );
  const taxAmount = (subtotal * (Number(watchedTaxRate) || 0)) / 100;
  const grandTotal = subtotal + taxAmount;
  const dueBalance = Math.max(0, grandTotal - (Number(watchedPaid) || 0));

  const handleItemSelect = (index: number, itemId: string, itemType: "ingredient" | "product") => {
    if (itemType === "ingredient") {
      const ing = ingredients.find((i) => i._id === itemId);
      if (ing) {
        setValue(`items.${index}.ingredientId`, ing._id);
        setValue(`items.${index}.name`, ing.name);
        setValue(`items.${index}.unit`, ing.defaultDisplayUnit || "kg");
      }
    } else {
      const prod = products.find((p) => p._id === itemId);
      if (prod) {
        setValue(`items.${index}.productId`, prod._id);
        setValue(`items.${index}.name`, prod.name);
        setValue(`items.${index}.unit`, "pcs");
        setValue(`items.${index}.unitCost`, prod.costPrice || 0);
      }
    }
  };

  const onSubmit = async (data: PurchaseInput) => {
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (!json.success) {
      toast.error(json.error ?? "Failed to record purchase");
      return;
    }

    toast.success("Purchase recorded & inventory received successfully");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-lime-600 dark:text-lime-400" />
            Record Bakery Supply Purchase
          </DialogTitle>
          <DialogDescription>
            Enter supplier invoices for raw ingredients (flour, sugar, butter) or resale products. Stock
            levels and weighted-average costs will update immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Header Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Supplier *</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-[#0f172a]"
                {...register("supplierId")}
              >
                <option value="">Select a supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.company ? `(${s.company})` : ""}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="text-xs text-red-500">{errors.supplierId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Purchase / Delivery Date</Label>
              <Input type="date" {...register("purchaseDate")} />
            </div>
          </div>

          {/* Line Items Grid */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Purchase Line Items
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() =>
                  append({
                    itemType: "ingredient",
                    ingredientId: "",
                    name: "",
                    quantity: 1,
                    unit: "kg",
                    unitCost: 0,
                  })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Line Item
              </Button>
            </div>

            <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
              {fields.map((field, index) => {
                const currentItemType = watch(`items.${index}.itemType`);
                const currentUnit = watch(`items.${index}.unit`);
                const isCustomUnit =
                  Boolean(currentUnit) &&
                  STANDARD_CONVERSIONS[currentUnit.toLowerCase()] === undefined;

                return (
                  <div
                    key={field.id}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-[#172033]/60 space-y-2"
                  >
                    <div className="grid grid-cols-12 gap-2 items-end">
                      {/* Type Toggle */}
                      <div className="col-span-3 sm:col-span-2">
                        <Label className="text-[11px] text-slate-500">Type</Label>
                        <select
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-800 dark:bg-[#0f172a]"
                          {...register(`items.${index}.itemType`)}
                          onChange={(e) => {
                            const val = e.target.value as "ingredient" | "product";
                            setValue(`items.${index}.itemType`, val);
                            setValue(`items.${index}.ingredientId`, "");
                            setValue(`items.${index}.productId`, "");
                            setValue(`items.${index}.name`, "");
                          }}
                        >
                          <option value="ingredient">Ingredient</option>
                          <option value="product">Product</option>
                        </select>
                      </div>

                      {/* Item Selector */}
                      <div className="col-span-9 sm:col-span-4">
                        <Label className="text-[11px] text-slate-500">
                          {currentItemType === "ingredient" ? "Select Ingredient *" : "Select Product *"}
                        </Label>
                        <select
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-800 dark:bg-[#0f172a]"
                          onChange={(e) => handleItemSelect(index, e.target.value, currentItemType)}
                          defaultValue=""
                        >
                          <option value="">
                            {currentItemType === "ingredient"
                              ? "-- Select Ingredient --"
                              : "-- Select Product --"}
                          </option>
                          {currentItemType === "ingredient"
                            ? ingredients.map((ing) => (
                                <option key={ing._id} value={ing._id}>
                                  {ing.name} ({ing.code})
                                </option>
                              ))
                            : products.map((prod) => (
                                <option key={prod._id} value={prod._id}>
                                  {prod.name} ({prod.sku})
                                </option>
                              ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-[11px] text-slate-500">Qty *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.001"
                          className="h-9 text-xs"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </div>

                      {/* Unit */}
                      <div className="col-span-3 sm:col-span-1">
                        <Label className="text-[11px] text-slate-500">Unit</Label>
                        <Input
                          className="h-9 text-xs"
                          placeholder="kg"
                          {...register(`items.${index}.unit`)}
                        />
                      </div>

                      {/* Rate in PKR */}
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-[11px] text-slate-500">Rate (Rs.) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-9 text-xs"
                          {...register(`items.${index}.unitCost`, { valueAsNumber: true })}
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-400 hover:text-red-500"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Custom conversion factor prompt if bulk package unit */}
                    {isCustomUnit && currentItemType === "ingredient" && (
                      <div className="flex items-center gap-3 pt-1 text-xs text-amber-700 dark:text-amber-300">
                        <span>Bulk unit detected: 1 {currentUnit} =</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-7 w-28 text-xs bg-white dark:bg-[#0f172a]"
                          placeholder="e.g. 50000"
                          {...register(`items.${index}.conversionFactor`, {
                            valueAsNumber: true,
                          })}
                        />
                        <span>base units (e.g. grams)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing & Summary Grid */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-[#172033]/60 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">Tax (%):</span>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="h-7 w-20 text-right text-xs"
                  {...register("taxRate", { valueAsNumber: true })}
                />
              </div>

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Grand Total:</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">Amount Paid (Rs.):</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-7 w-28 text-right font-mono text-xs font-bold"
                  {...register("paid", { valueAsNumber: true })}
                />
              </div>
            </div>

            {dueBalance > 0 && (
              <div className="flex justify-between text-xs text-amber-700 dark:text-amber-400 font-semibold border-t border-slate-200/80 pt-2 dark:border-slate-800">
                <span>Supplier Payable (Due Balance):</span>
                <span>{formatCurrency(dueBalance)}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes / Supplier Invoice Details</Label>
            <Input {...register("notes")} placeholder="e.g. Invoice #1234, delivered via Truck 4" />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Receiving Stock..." : "Submit & Receive Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
