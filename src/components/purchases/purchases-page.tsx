"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, RefreshCcw, Search, Plus, ShoppingBag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { PurchaseFormDialog } from "@/components/purchases/purchase-form-dialog";

interface PurchaseItem {
  itemType?: "ingredient" | "product";
  nameSnapshot?: string;
  name?: string;
  purchaseQuantity?: number;
  quantity?: number;
  purchaseUnit?: string;
  unitCost?: number;
  cost?: number;
  subtotal: number;
}

interface PurchaseRecord {
  _id: string;
  purchaseNumber: string;
  status: "completed" | "processing" | "failed" | "cancelled" | "pending" | "received" | "returned";
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  errorMessage?: string;
  receivedAt?: string | null;
  createdAt?: string;
  supplierId?: {
    name: string;
    company?: string;
    phone?: string;
  } | null;
  items: PurchaseItem[];
  notes?: string;
}

export function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/purchases${query}`);
      const json = await res.json();
      if (json.success) {
        setPurchases(json.data.items ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(loadPurchases, 250);
    return () => clearTimeout(timeout);
  }, [loadPurchases]);

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/90 shadow-xs dark:border-slate-800">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 p-4 dark:border-slate-800/80">
          <div>
            <CardTitle className="text-base font-bold">Bakery Purchases & Procurement</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage supplier orders, receive raw baking ingredients, and track inventory procurements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Record Purchase
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-slate-800 dark:bg-[#0f172a]"
                placeholder="Search purchase #, supplier, or items..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs flex items-center gap-1.5"
              onClick={loadPurchases}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200/80 overflow-x-auto dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50">
                <tr className="border-b border-slate-200/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3 px-3.5">Purchase #</th>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Supplier</th>
                  <th className="py-3 px-3.5">Items Summary</th>
                  <th className="py-3 px-3.5">Total Amount</th>
                  <th className="py-3 px-3.5">Paid</th>
                  <th className="py-3 px-3.5">Balance Due</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {purchases.map((purchase) => {
                  const balance = (purchase.total || 0) - (purchase.paid || 0);
                  const itemsSummary = purchase.items
                    .map((i) => `${i.nameSnapshot || i.name} (${i.purchaseQuantity || i.quantity} ${i.purchaseUnit || "pcs"})`)
                    .join(", ");

                  return (
                    <tr
                      key={purchase._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors text-xs"
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {purchase.purchaseNumber}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400">
                        {purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {purchase.supplierId?.name ?? "Unknown"}
                        </div>
                        {purchase.supplierId?.company && (
                          <div className="text-[10px] text-slate-400">{purchase.supplierId.company}</div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 max-w-xs truncate text-slate-600 dark:text-slate-400" title={itemsSummary}>
                        {itemsSummary || "No items"}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(purchase.total)}
                      </td>
                      <td className="py-3 px-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatCurrency(purchase.paid)}
                      </td>
                      <td className="py-3 px-3.5">
                        {balance > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            {formatCurrency(balance)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Rs. 0</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <Badge
                          variant={
                            purchase.status === "completed" || purchase.status === "received"
                              ? "success"
                              : purchase.status === "processing" || purchase.status === "pending"
                              ? "secondary"
                              : purchase.status === "failed" || purchase.status === "cancelled"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-[10px] font-medium capitalize"
                        >
                          {purchase.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setSelectedPurchase(purchase)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {isLoading && (
              <p className="py-8 text-center text-xs text-slate-400">Loading purchase records...</p>
            )}

            {!isLoading && purchases.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-500">
                <ShoppingBag className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No purchase records found.</p>
                <p className="text-slate-400 mt-1">
                  Click &quot;Record Purchase&quot; above to log raw ingredient or inventory procurement.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Purchase Detail Dialog */}
      <Dialog open={Boolean(selectedPurchase)} onOpenChange={(open) => !open && setSelectedPurchase(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-lime-600 dark:text-lime-400" />
              Purchase Order Details
            </DialogTitle>
            <DialogDescription>
              Invoice: <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedPurchase?.purchaseNumber}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4 text-xs pt-1">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#172033]/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Supplier</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedPurchase.supplierId?.name ?? "Unknown"}
                  </span>
                  {selectedPurchase.supplierId?.company && (
                    <span className="text-slate-500 block text-xs">{selectedPurchase.supplierId.company}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Date & Status</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPurchase.createdAt ? new Date(selectedPurchase.createdAt).toLocaleString() : "—"}
                  </span>
                  <Badge variant="secondary" className="mt-1 block w-fit text-[10px] capitalize">
                    {selectedPurchase.status}
                  </Badge>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-slate-200/80 overflow-hidden dark:border-slate-800">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-2 px-3 text-left">Item Name</th>
                      <th className="py-2 px-3 text-right">Quantity</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {selectedPurchase.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {item.nameSnapshot || item.name}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {item.purchaseQuantity || item.quantity} {item.purchaseUnit || "pcs"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {formatCurrency(item.unitCost || item.cost)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-1.5 dark:border-slate-800 dark:bg-[#172033]/60">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(selectedPurchase.subtotal)}</span>
                </div>
                {selectedPurchase.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax:</span>
                    <span>{formatCurrency(selectedPurchase.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-1.5 dark:border-slate-800">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(selectedPurchase.total)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(selectedPurchase.paid)}</span>
                </div>
                {selectedPurchase.total - selectedPurchase.paid > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(selectedPurchase.total - selectedPurchase.paid)}</span>
                  </div>
                )}
              </div>

              {selectedPurchase.notes && (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#0f172a]">
                  <span className="text-slate-400 font-semibold block mb-0.5">Notes:</span>
                  <p className="text-slate-700 dark:text-slate-300">{selectedPurchase.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Purchase Modal */}
      <PurchaseFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadPurchases}
      />
    </div>
  );
}
