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
  ingredientSchema,
  type IngredientInput,
} from "@/validations/ingredient.schema";
import {
  INGREDIENT_CATEGORIES,
  type IngredientRow,
  type UnitFamily,
} from "@/lib/unit-conversion";

interface SupplierOption {
  _id: string;
  name: string;
  company?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingIngredient?: IngredientRow | null;
}

const FAMILY_DISPLAY_UNITS: Record<UnitFamily, { value: string; label: string }[]> = {
  weight: [
    { value: "kg", label: "kg (Kilograms)" },
    { value: "g", label: "g (Grams)" },
  ],
  volume: [
    { value: "liter", label: "liter (Liters)" },
    { value: "ml", label: "ml (Milliliters)" },
  ],
  count: [
    { value: "pcs", label: "pcs (Pieces)" },
    { value: "dozen", label: "dozen (Dozen = 12 pcs)" },
    { value: "box", label: "box (Box)" },
    { value: "pack", label: "pack (Pack)" },
  ],
};

export function IngredientFormDialog({
  open,
  onOpenChange,
  onSuccess,
  editingIngredient,
}: Props) {
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const isEditing = Boolean(editingIngredient);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IngredientInput>({
    resolver: zodResolver(ingredientSchema) as never,
    defaultValues: {
      name: "",
      code: "",
      category: "Flour & Grains",
      unitFamily: "weight",
      defaultDisplayUnit: "kg",
      openingStock: 0,
      minimumStock: 0,
      initialCost: 0,
      notes: "",
    },
  });

  const selectedFamily = watch("unitFamily") as UnitFamily;

  useEffect(() => {
    if (open) {
      fetch("/api/suppliers")
        .then((r) => r.json())
        .then((json) => {
          if (json?.success && Array.isArray(json.data?.items)) {
            setSuppliers(json.data.items);
          }
        })
        .catch(() => {});

      if (editingIngredient) {
        reset({
          name: editingIngredient.name,
          code: editingIngredient.code,
          category: editingIngredient.category,
          unitFamily: editingIngredient.unitFamily,
          defaultDisplayUnit: editingIngredient.defaultDisplayUnit,
          minimumStock: editingIngredient.minimumStockInBaseUnit,
          preferredSupplierId: (editingIngredient.preferredSupplierId as unknown as { _id?: string })?._id ?? (editingIngredient.preferredSupplierId as unknown as string) ?? "",
          notes: editingIngredient.notes || "",
        });
      } else {
        reset({
          name: "",
          code: "",
          category: "Flour & Grains",
          unitFamily: "weight",
          defaultDisplayUnit: "kg",
          openingStock: 0,
          minimumStock: 0,
          initialCost: 0,
          notes: "",
        });
      }
    }
  }, [open, editingIngredient, reset]);

  // Sync default display unit when unit family changes
  const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const family = e.target.value as UnitFamily;
    setValue("unitFamily", family);
    if (family === "weight") setValue("defaultDisplayUnit", "kg");
    else if (family === "volume") setValue("defaultDisplayUnit", "liter");
    else if (family === "count") setValue("defaultDisplayUnit", "pcs");
  };

  const onSubmit = async (data: IngredientInput) => {
    const url = isEditing ? `/api/ingredients/${editingIngredient?._id}` : "/api/ingredients";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (!json.success) {
      toast.error(json.error ?? "Failed to save ingredient");
      return;
    }

    toast.success(isEditing ? "Ingredient updated" : "Ingredient registered successfully");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Raw Ingredient" : "Register Raw Ingredient"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update ingredient properties, reorder threshold, and preferred supplier."
              : "Add a bakery raw material or packaging supply with base unit normalization."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Ingredient Name *</Label>
            <Input {...register("name")} placeholder="e.g. All-Purpose Flour, Unsalted Butter, Cocoa Powder" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-[#0f172a]"
                {...register("category")}
              >
                {INGREDIENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Internal Code <span className="text-xs font-normal text-slate-400">(Auto-generated if blank)</span>
              </Label>
              <Input {...register("code")} placeholder="e.g. ING-FLOUR-001" disabled={isEditing} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Family *</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-[#0f172a]"
                {...register("unitFamily")}
                onChange={handleFamilyChange}
                disabled={isEditing}
              >
                <option value="weight">Weight (g / kg)</option>
                <option value="volume">Volume (ml / liter)</option>
                <option value="count">Count (pcs / dozen / box)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Default Display Unit *</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-[#0f172a]"
                {...register("defaultDisplayUnit")}
              >
                {(FAMILY_DISPLAY_UNITS[selectedFamily] || FAMILY_DISPLAY_UNITS.weight).map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isEditing && (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-[#172033]/50 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Opening Stock & Initial Cost
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Opening Stock Quantity</Label>
                  <Input type="number" step="0.01" {...register("openingStock", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Cost per {watch("defaultDisplayUnit")} (Rs.)</Label>
                  <Input type="number" step="0.01" {...register("initialCost", { valueAsNumber: true })} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Stock Alert ({watch("defaultDisplayUnit")})</Label>
              <Input type="number" step="0.01" {...register("minimumStock", { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label>Preferred Supplier</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-[#0f172a]"
                {...register("preferredSupplierId")}
              >
                <option value="">None / Multiple</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.company ? `(${s.company})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes / Storage Instructions</Label>
            <Input {...register("notes")} placeholder="e.g. Store in cool, dry place" />
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
              {isSubmitting ? "Saving..." : isEditing ? "Update Ingredient" : "Register Ingredient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
