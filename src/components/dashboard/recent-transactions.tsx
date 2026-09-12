import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  _id: string;
  invoiceNumber: string;
  total: number;
  createdAt: string;
  cashierId?: { name?: string };
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {transactions.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No transactions recorded yet</p>
          )}
          {transactions.map((tx) => (
            <div
              key={tx._id}
              className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 hover:bg-slate-100/70 transition-colors dark:border-slate-800/80 dark:bg-[#172033]/60 dark:hover:bg-[#172033]"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tx.invoiceNumber}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {new Date(tx.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(tx.total)}
                </p>
                <Badge variant="secondary" className="text-[11px] mt-0.5">
                  {tx.cashierId?.name ?? "Staff"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
