"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

type Transaction = {
  id: number;
  type: string;
  grams: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
};

type TransactionListProps = {
  transactions: Transaction[];
};

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <Card className="border-dashed border-slate-200 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-slate-100 p-3 text-slate-400">
            <Clock className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">No transactions yet.</p>
          <p className="text-xs text-slate-400">Your gold trades will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-amber-100 hover:shadow-md hover:shadow-amber-900/5"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              tx.type === "BUY" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
              {tx.type === "BUY" ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {tx.type === "BUY" ? "Purchased Gold" : "Sold Gold"}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                <span>{format(tx.createdAt, "dd MMM yyyy, hh:mm a")}</span>
                <span className="h-1 w-1 rounded-full bg-slate-200" />
                <div className="flex items-center gap-1">
                  {tx.status === "COMPLETED" ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                  )}
                  <span className={tx.status === "COMPLETED" ? "text-emerald-600" : "text-amber-600"}>
                    {tx.status.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-sm font-black",
              tx.type === "BUY" ? "text-slate-900" : "text-slate-900"
            )}>
              {tx.type === "BUY" ? "+" : "-"}{parseFloat(tx.grams).toFixed(3)}g
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              ₹{tx.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}