import { auth } from "@clerk/nextjs/server";
import {
  ShieldCheck,
  Activity,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
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
import { TransactionList } from "@/components/gold-investment/transaction-list";
import { TradeModal } from "@/components/gold-investment/trade-modal";

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
  const portfolioValue = userGrams * (currentPrice as number);

  return (
    <div className="bg-slate-50 min-h-screen w-full relative overflow-x-hidden text-slate-900 font-sans selection:bg-amber-500/30">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] h-[70vh] w-[70vw] rounded-full bg-linear-to-br from-amber-200/40 via-amber-100/20 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[60vh] w-[60vw] rounded-full bg-linear-to-tl from-slate-200/50 to-transparent blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-screen w-screen bg-[radial-gradient(ellipse_at_center,transparent_20%,#ffffff_100%)] opacity-80" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div className="flex items-center justify-between">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-slate-200 bg-white/50 px-4 text-slate-700 hover:bg-white hover:text-slate-900 hover:border-amber-500/30 transition-all backdrop-blur-md"
          >
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wealth Dashboard
            </Link>
          </Button>

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-white/60 backdrop-blur shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Live Market</span>
          </div>
        </div>

        <div className="flex flex-col items-center text-center space-y-3 pt-4 sm:pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Total Gold Reserves</h2>
          <div className="relative inline-block">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif tracking-tight text-slate-950 flex items-start justify-center gap-2">
              <span className="text-3xl sm:text-5xl lg:text-6xl text-amber-500 mt-1 sm:mt-3">₹</span>
              {portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h1>
          </div>
          <p className="text-lg sm:text-xl font-medium text-amber-500/90 mt-2">
            ≈ {userGrams.toFixed(4)} <span className="text-sm text-amber-600/80">GRAMS (24K 99.9%)</span>
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3 xl:gap-8 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <Card className="border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-6 border-b border-slate-100">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-serif text-slate-900 tracking-tight flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                    Market Performance (₹)
                  </CardTitle>
                </div>
                <div className="bg-slate-100/80 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 mt-4 sm:mt-0 border border-slate-200">
                  Last 30 Days API Sync
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-6">
                <div>
                  {history.success && <MarketChart data={history.data} />}
                </div>
              </CardContent>
            </Card>

            <div className="mt-auto rounded-[2rem] border border-slate-200/60 bg-white/80 backdrop-blur-xl p-1 overflow-hidden">
              <div className="p-1">
                {userHoldings.success && (
                  <InvestmentStats holdings={userHoldings?.holdings as any} />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="border-amber-500/30 bg-linear-to-br from-white to-amber-50/30 shadow-[0_8px_40px_rgba(245,158,11,0.08)] backdrop-blur-xl relative overflow-hidden rounded-[2rem]">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent"></div>
              <CardHeader className="space-y-1.5 pb-6 px-8 relative z-10">
                <CardTitle className="text-2xl font-bold font-serif text-amber-600 tracking-tight">
                  Execution Engine
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium text-sm">
                  Instant liquidity. 24/7 Access.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-8 relative z-10">
                <div className="flex flex-col gap-4">
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
                <div className="mt-4 flex items-start gap-4 rounded-2xl bg-amber-500/5 p-5 border border-amber-500/10 transition-colors hover:bg-amber-500/10">
                  <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 shrink-0 border border-amber-500/20 shadow-inner">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-500 tracking-wide">
                      Bank-Grade Security
                    </p>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Physical 24K gold stored sequentially in Brink's insured vaults. Audited daily.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-md rounded-[2rem] flex-1">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-5 px-8 pt-6">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Recent Activity
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {userHoldings.success && (
                  <div className="p-4">
                    <TransactionList
                      transactions={userHoldings.transactions as any}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}