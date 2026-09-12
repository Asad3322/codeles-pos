"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  ingredientAdjustSchema,
  type IngredientAdjustInput,
} from "@/validations/ingredient.schema";
import {
  FAMILY_ALLOWED_UNITS,
  STANDARD_CONVERSIONS,
  formatIngredientStock,
  type IngredientRow,
} from "@/lib/unit-conversion";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: IngredientRow | null;
  onSuccess: () => void;
}

const REASONS = [
  { value: "physical_count", label: "Physical Inventory Count" },
  { value: "damage", label: "Damaged / Spilled" },
  { value: "expired", label: "Expired Stock" },
  { value: "correction", label: "Data Entry Correction" },
  { value: "opening_stock", label: "Opening Stock Adjustment" },
];

export function IngredientAdjustDialog({
  open,
  onOpenChange,
  ingredient,
  onSuccess,
}: Props) {
  const [selectedUnit, setSelectedUnit] = useState<string>("kg");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IngredientAdjustInput>({
    resolver: zodResolver(ingredientAdjustSchema),
    defaultValues: {
      adjustmentType: "add",
      quantity: 1,
      unit: "kg",
      reason: "physical_count",
      notes: "",
    },
  });

  const adjustmentType = watch("adjustmentType");
  const watchUnit = watch("unit");

  const isCustomUnit =
    Boolean(watchUnit) && STANDARD_CONVERSIONS[watchUnit.toLowerCase()] === undefined;

  useEffect(() => {
    if (open && ingredient) {
      const defaultUnit = ingredient.defaultDisplayUnit || "kg";
      setSelectedUnit(defaultUnit);
      reset({
        adjustmentType: "add",
        quantity: 1,
        unit: defaultUnit,
        reason: "physical_count",
        notes: "",
      });
    }
  }, [open, ingredient, reset]);

  if (!ingredient) return null;

  const allowedUnits = FAMILY_ALLOWED_UNITS[ingredient.unitFamily] || ["g", "kg"];

  const onSubmit = async (data: IngredientAdjustInput) => {
    const res = await fetch(`/api/ingredients/${ingredient._id}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (!json.success) {
      toast.error(json.error ?? "Failed to adjust stock");
      return;
    }

    toast.success("Ingredient stock adjusted successfully");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Ingredient Stock</DialogTitle>
          <DialogDescription>
            Record a physical count, shrinkage, or manual correction for{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {ingredient.name}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-[#172033]/60 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Current Stock:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatIngredientStock(ingredient.stockInBaseUnit, ingredient.defaultDisplayUnit)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Base Unit:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {ingredient.stockInBaseUnit} {ingredient.baseUnit}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label>Action Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setValue("adjustmentType", "add")}
                className={`rounded-lg py-2 text-xs font-semibold border transition ${
                  adjustmentType === "add"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-[#0f172a] dark:text-slate-300 dark:border-slate-800"
                }`}
              >
                + Add Stock
              </button>
              <button
                type="button"
                onClick={() => setValue("adjustmentType", "subtract")}
                className={`rounded-lg py-2 text-xs font-semibold border transition ${
                  adjustmentType === "subtract"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-[#0f172a] dark:text-slate-300 dark:border-slate-800"
                }`}
              >
                - Deduct Stock
              </button>
              <button
                type="button"
                onClick={() => setValue("adjustmentType", "set")}
                className={`rounded-lg py-2 text-xs font-semibold border transition ${
                  adjustmentType === "set"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs dark:bg-lime-600 dark:border-lime-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-[#0f172a] dark:text-slate-300 dark:border-slate-800"
                }`}
              >
                = Set Exact Stock
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                step="0.001"
                min="0.0001"
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-[#0f172a]"
                {...register("unit")}
                onChange={(e) => {
                  setSelectedUnit(e.target.value);
                  setValue("unit", e.target.value);
                }}
              >
                {allowedUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isCustomUnit && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <Label className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                Custom Conversion: 1 {watchUnit} = ? {ingredient.baseUnit}
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder={`e.g. 50000 for 50kg bag`}
                {...register("conversionFactor", { valueAsNumber: true })}
              />
              {errors.conversionFactor && (
                <p className="text-xs text-red-500">{errors.conversionFactor.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason *</Label>
            <select
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-[#0f172a]"
              {...register("reason")}
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input {...register("notes")} placeholder="Details about this adjustment" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adjusting..." : "Confirm Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
