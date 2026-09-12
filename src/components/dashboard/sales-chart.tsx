"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/components/providers/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface SalesChartProps {
  data: { _id: string; revenue: number; count: number }[];
}

export function SalesChart({ data }: SalesChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const chartData = data.map((d) => ({
    date: d._id,
    revenue: d.revenue,
    sales: d.count,
  }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#84cc16" stopOpacity={isDark ? 0.35 : 0.22} />
                <stop offset="95%" stopColor="#84cc16" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
              stroke={isDark ? "#334155" : "#cbd5e1"}
            />
            <YAxis
              tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
              stroke={isDark ? "#334155" : "#cbd5e1"}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                borderRadius: "0.75rem",
                color: isDark ? "#f8fafc" : "#0f172a",
                boxShadow: isDark
                  ? "0 4px 16px rgba(0, 0, 0, 0.4)"
                  : "0 4px 16px rgba(0, 0, 0, 0.08)",
              }}
              labelStyle={{
                color: isDark ? "#94a3b8" : "#64748b",
                fontWeight: 600,
                marginBottom: 4,
              }}
              itemStyle={{
                color: "#84cc16",
                fontWeight: 700,
              }}
              formatter={(value: unknown) => [
                formatCurrency(Number(value) || 0),
                "Revenue",
              ]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#84cc16"
              strokeWidth={2.5}
              fill="url(#salesGradient)"
              name="Revenue"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
