import { auth } from "@clerk/nextjs/server";
import {
  Info,
  ShieldCheck,
  Activity,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getLiveGoldPriceINR,
  getGoldHistoryINR,
} from "@/app/actions/gold-price";
import { getUserGoldHoldings } from "@/app/actions/gold-investment";
import { InvestmentStats } from "@/components/gold-investment/investment-stats";
import { MarketChart } from "@/components/gold-investment/market-chart";
import { TradeModal } from "@/components/gold-investment/trade-modal";
import { TransactionList } from "@/components/gold-investment/transaction-list";

export default async function InvestInGoldPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const [livePrice, history, userHoldings] = await Promise.all([
    getLiveGoldPriceINR(),
    getGoldHistoryINR(30),
    getUserGoldHoldings(),
  ]);

  const currentPrice = livePrice.success ? livePrice.gram : 0;
  // @ts-ignore
  const userGrams = userHoldings.success ? userHoldings.holdings.totalGrams : 0;

  return (
    <DashboardShell showHeaderCard={false}>
      <div className="space-y-8 pb-12 pt-4">
        <div className="flex items-center gap-4 border-b border-stone-200 pb-6">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="rounded-full shadow-sm bg-white hover:bg-stone-50 border-stone-200 transition-all text-stone-600"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4.5 w-4.5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              Invest in Gold
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Live digital gold trading, backed by physical assets.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3 xl:gap-8">
          <div className="xl:col-span-2 space-y-6 flex flex-col">
            <Card className="overflow-hidden border-stone-200/60 bg-white/80 shadow-xs backdrop-blur-xl flex-1">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-stone-100/50">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-serif text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Market Performance (₹)
                  </CardTitle>
                </div>
                <div className="bg-stone-100/80 px-3 py-1 rounded-full text-xs font-semibold text-stone-600 mt-4 sm:mt-0">
                  Last 30 Days + 7 Day Forecast
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 pt-6">
                {history.success && <MarketChart data={history.data} />}
              </CardContent>
            </Card>

            <div className="mt-auto">
              {userHoldings.success && (
                <InvestmentStats holdings={userHoldings?.holdings as any} />
              )}
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <Card className="border-amber-200/80 bg-linear-to-b from-amber-50/80 to-white shadow-xl shadow-amber-900/5 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>

              <CardHeader className="space-y-1.5 pb-4 relative z-10">
                <CardTitle className="text-xl font-bold font-serif text-amber-950">
                  Spot Trading
                </CardTitle>
                <CardDescription className="text-amber-900/70 font-medium text-sm">
                  Grow your digital gold reserves.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  <TradeModal
                    type="BUY"
                    livePriceState={{
                      gram: currentPrice as number,
                      success: livePrice.success,
                    }}
                    userGrams={userGrams}
                  />
                  <TradeModal
                    type="SELL"
                    livePriceState={{
                      gram: currentPrice as number,
                      success: livePrice.success,
                    }}
                    userGrams={userGrams}
                  />
                </div>

                <div className="mt-2 flex items-start gap-4 rounded-2xl bg-amber-950/5 p-4 border border-amber-900/10 transition-colors hover:bg-amber-950/10">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-950">
                      Bank-Grade Vaults
                    </p>
                    <p className="text-xs leading-relaxed text-amber-900/70">
                      Fully insured 24K 99.9% physical gold stored sequentially
                      in secure vaults.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/60 bg-white shadow-sm flex-1">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-600">
                    Recent Transactions
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {userHoldings.success && (
                  <TransactionList
                    transactions={
                      userHoldings?.transactions?.slice(0, 4) as any
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-4">
          <div className="group rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl relative overflow-hidden transition-all hover:shadow-black/40 hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Info className="h-32 w-32" />
            </div>

            <h3 className="text-2xl font-serif font-black tracking-tight flex items-center gap-3 relative z-10">
              <div className="bg-amber-500/20 p-2 rounded-xl">
                <Info className="h-5 w-5 text-amber-400" />
              </div>
              The Golden Standard
            </h3>
            <p className="mt-5 leading-relaxed text-slate-300 relative z-10 text-sm md:text-base">
              Gold has traditionally been a powerful hedge against inflation and
              currency fluctuations. With GoldCraft, you gain all the benefits
              of pure gold ownership without the risks of physical handling and
              storage.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6 relative z-10 border-t border-slate-800/60 pt-6">
              <div>
                <p className="text-amber-400 font-bold text-xl md:text-2xl">
                  24K 99.9%
                </p>
                <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">
                  Pure Certified Gold
                </p>
              </div>
              <div>
                <p className="text-amber-400 font-bold text-xl md:text-2xl border-l border-slate-800/60 pl-6">
                  Zero
                </p>
                <p className="text-xs md:text-sm text-slate-400 font-medium mt-1 pl-6">
                  Storage Fees
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-serif font-black tracking-tight text-slate-900 flex items-center gap-2">
                Wealth Advisory
              </h3>
              <p className="mt-4 leading-relaxed text-stone-600 text-sm md:text-base">
                Experts recommend allocating <strong>5-15%</strong> of your
                portfolio to gold as a safety net. Use our live market updates
                to decide your entry and exit points with precision.
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-white p-4 border border-stone-200 gap-4">
              <div className="flex -space-x-3 overflow-hidden">
                <div className="h-10 w-10 text-xs flex items-center justify-center font-bold text-white rounded-full ring-4 ring-white bg-amber-600 z-30">
                  GC
                </div>
                <div className="h-10 w-10 text-xs flex items-center justify-center font-bold text-white rounded-full ring-4 ring-white bg-slate-700 z-20">
                  IN
                </div>
                <div className="h-10 w-10 text-xs flex items-center justify-center font-bold text-slate-600 rounded-full ring-4 ring-white bg-stone-200 z-10">
                  +
                </div>
              </div>
              <p className="text-xs font-bold text-stone-800 uppercase tracking-widest text-center sm:text-right">
                Join 5,000+
                <br />
                Savvy Investors
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}