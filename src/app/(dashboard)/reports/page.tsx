"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ModulePage } from "@/components/shared/module-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  type ReportRow,
} from "@/lib/export-reports";
import { formatCurrency } from "@/lib/utils";

type ReportType =
  | "sales"
  | "inventory"
  | "ingredient_stock"
  | "purchases"
  | "low_stock"
  | "suppliers"
  | "customers"
  | "profit";

const REPORT_OPTIONS: { type: ReportType; label: string; description: string }[] = [
  { type: "sales", label: "Bakery Sales", description: "Completed sales transactions and revenue totals" },
  { type: "ingredient_stock", label: "Ingredient Stock", description: "Raw material inventory, base unit quantities, and valuations" },
  { type: "purchases", label: "Ingredient Purchases", description: "Supplier purchases, unit costs, and invoice receipts" },
  { type: "low_stock", label: "Low Stock Alerts", description: "Raw ingredients and bakery items below minimum threshold" },
  { type: "inventory", label: "Finished Bakery Stock", description: "Finished goods stock, selling prices, and category levels" },
  { type: "suppliers", label: "Supplier Purchases & Balances", description: "Vendor contacts, paid amounts, and outstanding balances" },
  { type: "profit", label: "Cash Flow Summary", description: "Operational net cash flow (Sales - Purchases - Expenses)" },
  { type: "customers", label: "Customer Balances", description: "Customer balances, orders, and loyalty points" },
];

const MONETARY_COLUMNS = new Set([
  "Subtotal",
  "Discount",
  "Tax",
  "Total",
  "Cost Price",
  "Sell Price",
  "Due Balance",
  "Total Purchases",
]);

function formatReportCell(col: string, val: unknown, row: ReportRow): string {
  if (val === null || val === undefined || val === "") return "—";
  if (MONETARY_COLUMNS.has(col) && (typeof val === "number" || !isNaN(Number(val)))) {
    return formatCurrency(Number(val));
  }
  if (col === "Amount" && row.Metric !== "Sales Count" && (typeof val === "number" || !isNaN(Number(val)))) {
    return formatCurrency(Number(val));
  }
  return String(val);
}

export default function ReportsPage() {
  const [loading, setLoading] = useState<ReportType | null>(null);
  const [preview, setPreview] = useState<{ type: ReportType; rows: ReportRow[] } | null>(null);
  const [days, setDays] = useState(30);

  const fetchReport = async (type: ReportType) => {
    setLoading(type);
    try {
      const res = await fetch(`/api/reports?type=${type}&days=${days}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setPreview({ type, rows: json.data.rows });
      return json.data.rows as ReportRow[];
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load report");
      return null;
    } finally {
      setLoading(null);
    }
  };

  const getColumns = (rows: ReportRow[]) => {
    if (rows.length === 0) return [];
    return Object.keys(rows[0]);
  };

  const handleExport = async (
    type: ReportType,
    format: "pdf" | "excel" | "csv"
  ) => {
    let rows = preview?.type === type ? preview.rows : null;
    if (!rows) rows = await fetchReport(type);
    if (!rows || rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const columns = getColumns(rows);
    const title = REPORT_OPTIONS.find((r) => r.type === type)!.label;
    const filename = `${type}-report-${new Date().toISOString().slice(0, 10)}`;

    if (format === "pdf") {
      const formattedRows = rows.map((row) => {
        const entry: ReportRow = {};
        columns.forEach((col) => {
          entry[col] = formatReportCell(col, row[col], row);
        });
        return entry;
      });
      exportToPDF(title, columns, formattedRows, filename);
    } else if (format === "excel") {
      exportToExcel(title, columns, rows, filename);
    } else {
      exportToCSV(columns, rows, filename);
    }

    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  return (
    <ModulePage title="Reports" description="Sales, inventory, and financial reports with export">
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm text-zinc-500 dark:text-zinc-400">
          Period (days):
          <select
            className="ml-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {REPORT_OPTIONS.map((report) => (
          <Card key={report.type}>
            <CardHeader>
              <CardTitle className="text-base">{report.label}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading === report.type}
                onClick={() => fetchReport(report.type)}
              >
                {loading === report.type ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(report.type, "pdf")}
              >
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(report.type, "excel")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(report.type, "csv")}
              >
                CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {preview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Preview: {REPORT_OPTIONS.find((r) => r.type === preview.type)?.label}
            </CardTitle>
            <CardDescription>{preview.rows.length} rows</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-zinc-500 dark:text-zinc-400">
                  {getColumns(preview.rows).map((col) => (
                    <th key={col} className="pb-2 pr-4 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                    {getColumns(preview.rows).map((col) => (
                      <td key={col} className="py-2 pr-4">
                        {formatReportCell(col, row[col], row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 20 && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Showing 20 of {preview.rows.length} rows
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </ModulePage>
  );
}
