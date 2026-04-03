"use client";

import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  IndianRupee 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type InvestmentStatsProps = {
  holdings: {
    totalGrams: number;
    totalInvested: number;
    currentValue: number;
    pnl: number;
    pnlPercentage: number;
  };
};

export function InvestmentStats({ holdings }: InvestmentStatsProps) {
  const formatINR = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isProfit = holdings.pnl >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-amber-100 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">Current Holdings</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-slate-900">
              {holdings.totalGrams.toFixed(3)}
            </span>
            <span className="ml-1 text-sm font-medium text-slate-400 text-uppercase">grams</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Current Est. Value: {formatINR(holdings.currentValue)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-amber-100 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <IndianRupee className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Invested</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-slate-900">
              {formatINR(holdings.totalInvested)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Average price: {holdings.totalGrams > 0 ? formatINR(holdings.totalInvested / holdings.totalGrams) : '₹0'}/g</p>
        </CardContent>
      </Card>

      <Card className="border-amber-100 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-stone-50 p-2 text-stone-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">Net Profit / Loss</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-bold",
              isProfit ? "text-emerald-700" : "text-rose-700"
            )}>
              {isProfit ? "+" : ""}{formatINR(holdings.pnl)}
            </span>
            <div className={cn(
              "flex items-center text-xs font-semibold",
              isProfit ? "text-emerald-600" : "text-rose-600"
            )}>
              {isProfit ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(holdings.pnlPercentage).toFixed(2)}%
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-400">Calculated based on live spot price</p>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}