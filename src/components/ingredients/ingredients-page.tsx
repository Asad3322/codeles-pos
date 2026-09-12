"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, SlidersHorizontal, AlertTriangle, Package2, DollarSign, Truck, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import {
  formatIngredientStock,
  STANDARD_CONVERSIONS,
  INGREDIENT_CATEGORIES,
  type IngredientRow,
} from "@/lib/unit-conversion";
import { IngredientFormDialog } from "@/components/ingredients/ingredient-form-dialog";
import { IngredientAdjustDialog } from "@/components/ingredients/ingredient-adjust-dialog";

export function IngredientsPage() {
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientRow | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const loadIngredients = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category !== "all") params.set("category", category);
      if (status !== "all") params.set("status", status);
      params.set("limit", "100");

      const res = await fetch(`/api/ingredients?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setIngredients(json.data.items ?? []);
        setTotalCount(json.data.total ?? 0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, category, status]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const openEdit = (ing: IngredientRow) => {
    setSelectedIngredient(ing);
    setFormDialogOpen(true);
  };

  const openAdjust = (ing: IngredientRow) => {
    setSelectedIngredient(ing);
    setAdjustDialogOpen(true);
  };

  const openCreate = () => {
    setSelectedIngredient(null);
    setFormDialogOpen(true);
  };

  // KPI Calculations
  const lowStockCount = ingredients.filter(
    (i) => i.stockInBaseUnit <= i.minimumStockInBaseUnit && i.stockInBaseUnit > 0
  ).length;

  const outOfStockCount = ingredients.filter((i) => i.stockInBaseUnit <= 0).length;

  const totalRawStockValue = ingredients.reduce(
    (sum, i) => sum + (i.stockInBaseUnit || 0) * (i.averageCostPerBaseUnit || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Raw Ingredients
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400">
              <Package2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</div>
            <p className="text-xs text-slate-400 mt-0.5">Active procurement items</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Low / Out of Stock
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {lowStockCount + outOfStockCount}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {outOfStockCount} out of stock, {lowStockCount} below threshold
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Raw Stock Valuation
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(totalRawStockValue)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">At weighted-average procurement cost</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Supply Categories
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Truck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {INGREDIENT_CATEGORIES.length}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Standard bakery supply families</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Ingredient Table Card */}
      <Card className="border-slate-200/90 shadow-xs dark:border-slate-800">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 p-4 dark:border-slate-800/80">
          <div>
            <CardTitle className="text-base font-bold">Raw Ingredients & Supplies</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage bakery raw stock, normalized base units, procurement costs, and reorder levels.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Register Ingredient
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by ingredient name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-800 dark:bg-[#0f172a]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {INGREDIENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-800 dark:bg-[#0f172a]"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock Only</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200/80 overflow-x-auto dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50">
                <tr className="border-b border-slate-200/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3 px-3.5">Ingredient</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Stock Level</th>
                  <th className="py-3 px-3.5">Avg Unit Cost</th>
                  <th className="py-3 px-3.5">Stock Value</th>
                  <th className="py-3 px-3.5">Reorder Min</th>
                  <th className="py-3 px-3.5">Preferred Supplier</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {ingredients.map((ing) => {
                  const factor = STANDARD_CONVERSIONS[ing.defaultDisplayUnit.toLowerCase()] || 1;
                  const displayCost = (ing.averageCostPerBaseUnit || 0) * factor;
                  const lineValue = ing.stockInBaseUnit * (ing.averageCostPerBaseUnit || 0);
                  const isLow =
                    ing.stockInBaseUnit <= ing.minimumStockInBaseUnit && ing.stockInBaseUnit > 0;
                  const isOut = ing.stockInBaseUnit <= 0;

                  return (
                    <tr
                      key={String(ing._id)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors text-xs"
                    >
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {ing.name}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{ing.code}</span>
                      </td>

                      <td className="py-3 px-3.5">
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {ing.category}
                        </Badge>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatIngredientStock(ing.stockInBaseUnit, ing.defaultDisplayUnit)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {ing.stockInBaseUnit} {ing.baseUnit}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 font-medium">
                        <div>
                          {formatCurrency(displayCost)} / {ing.defaultDisplayUnit}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          (Rs. {ing.averageCostPerBaseUnit.toFixed(4)}/{ing.baseUnit})
                        </div>
                      </td>

                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(lineValue)}
                      </td>

                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400">
                        {formatIngredientStock(ing.minimumStockInBaseUnit, ing.defaultDisplayUnit)}
                      </td>

                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400">
                        {(ing.preferredSupplierId as unknown as { name?: string })?.name ?? "—"}
                      </td>

                      <td className="py-3 px-3.5">
                        <Badge
                          variant={isOut ? "destructive" : isLow ? "warning" : "success"}
                          className="text-[10px] font-medium"
                        >
                          {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                        </Badge>
                      </td>

                      <td className="py-3 px-3.5 text-right space-x-1 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => openAdjust(ing)}
                          title="Adjust physical stock"
                        >
                          <SlidersHorizontal className="mr-1 h-3 w-3" />
                          Adjust
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(ing)}
                          title="Edit ingredient metadata"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {isLoading && (
              <p className="py-8 text-center text-xs text-slate-400">Loading raw ingredients...</p>
            )}

            {!isLoading && ingredients.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-500">
                <Package2 className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No raw ingredients registered yet.
                </p>
                <p className="text-slate-400 mt-1">
                  Click &quot;Register Ingredient&quot; above to add bakery flour, sugar, butter, or packaging supplies.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Ingredient Form Dialog */}
      <IngredientFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSuccess={loadIngredients}
        editingIngredient={selectedIngredient}
      />

      {/* Stock Adjustment Dialog */}
      <IngredientAdjustDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        ingredient={selectedIngredient}
        onSuccess={loadIngredients}
      />
    </div>
  );
}
