"use client";

import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { ModulePage } from "@/components/shared/module-page";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ProductRow {
  _id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stock: number;
  isActive: boolean;
  categoryId?: { name?: string };
}

const columnHelper = createColumnHelper<ProductRow>();

const columns = [
  columnHelper.accessor("name", {
    header: "Bakery Item",
    cell: (info) => (
      <span className="font-semibold text-slate-900 dark:text-slate-100">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("sku", {
    header: "SKU",
    cell: (info) => (
      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("sellingPrice", {
    header: "Price",
    cell: (info) => (
      <span className="font-bold text-slate-900 dark:text-white">
        {formatCurrency(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("stock", {
    header: "Stock",
    cell: (info) => (
      <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("isActive", {
    header: "Status",
    cell: (info) => (
      <Badge variant={info.getValue() ? "success" : "secondary"}>
        {info.getValue() ? "Active" : "Inactive"}
      </Badge>
    ),
  }),
];

export default function ProductsPage() {
  const [data, setData] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products?limit=50");
      const json = await res.json();
      if (json.success) setData(json.data.items ?? []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <ModulePage
      title="Bakery Items"
      description="Manage bakery items catalog, pricing, and stock"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bakery Items</CardTitle>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Bakery Item
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading bakery items...</p>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50">
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-slate-200/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        {hg.headers.map((h) => (
                          <th key={h.id} className="py-3 px-4 font-semibold">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-3.5 px-4">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">No bakery items found. Add your first bakery item using the button above.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={load}
      />
    </ModulePage>
  );
}
