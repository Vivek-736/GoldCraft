import { auth } from "@clerk/nextjs/server";
import { TrendingUp, Info, ShieldCheck, Activity } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getLiveGoldPriceINR, getGoldHistoryINR } from "@/app/actions/gold-price";
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
    <DashboardShell
      eyebrow="Gold Wealth Management"
      title="Invest in Digital Gold"
      description="GoldCraft pairs digital ease with physical-grade trust. Accumulate 24K 99.9% pure gold, track market performance, and secure your future."
    >
      <div className="space-y-8 pb-12">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-amber-100/50 bg-white shadow-xl shadow-amber-900/5 transition-all hover:shadow-amber-900/10">
              <CardHeader className="flex flex-row items-center justify-between border-b border-amber-50 bg-amber-50/20 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-600 p-2 text-white">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">Market Performance</CardTitle>
                    <CardDescription className="text-xs">Live 24K Gold Price (INR per Gram)</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-500">Live Price</p>
                  <p className="text-xl font-black text-amber-600">₹{currentPrice?.toLocaleString()}</p>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                {history.success && <MarketChart data={history.data} />}
              </CardContent>
            </Card>

            {userHoldings.success && <InvestmentStats holdings={userHoldings?.holdings as any} />}
          </div>

          <div className="space-y-6">
            <Card className="border-amber-200 bg-linear-to-b from-amber-50 to-white shadow-xl shadow-amber-900/5">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-black text-amber-900">Trade Gold</CardTitle>
                <CardDescription className="text-amber-800/60">Manage your digital gold assets safely.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TradeModal
                  type="BUY"
                  livePriceState={{ gram: currentPrice as number, success: livePrice.success }}
                  userGrams={userGrams}
                />
                <TradeModal
                  type="SELL"
                  livePriceState={{ gram: currentPrice as number, success: livePrice.success }}
                  userGrams={userGrams}
                />

                <div className="mt-6 flex items-start gap-3 rounded-2xl bg-amber-100/30 p-4 border border-amber-100">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-700" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900">Secure Storage</p>
                    <p className="text-[10px] leading-relaxed text-amber-800/80">Every gram you buy is backed by physically insured 24K 99.9% pure gold stored in digital vaults.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 bg-white/50 backdrop-blur shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Recent Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {userHoldings.success && (
                  <TransactionList transactions={userHoldings?.transactions?.slice(0, 4) as any} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl">
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Info className="h-6 w-6 text-amber-500" />
              Why Invest in Gold?
            </h3>
            <p className="mt-4 leading-relaxed text-slate-300">
              Gold has traditionally been a powerful hedge against inflation and currency fluctuations.
              With GoldCraft, you gain all the benefits of pure gold ownership without the risks of physical handling and storage.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <p className="text-amber-500 font-bold text-lg">24K 99.9%</p>
                <p className="text-xs text-slate-400">Pure Certified Gold</p>
              </div>
              <div>
                <p className="text-amber-500 font-bold text-lg">Instant</p>
                <p className="text-xs text-slate-400">Buying & Selling</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-100 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Wealth Advisory</h3>
            <p className="mt-4 leading-relaxed text-slate-600">
              Experts recommend allocating 5-15% of your portfolio to gold as a safety net.
              Use our live market updates to decide your entry and exit points with precision.
            </p>
            <div className="mt-8 flex items-center justify-between rounded-2xl bg-amber-50 p-4 border border-amber-100">
              <div className="flex -space-x-3 overflow-hidden">
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200" />
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-300" />
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-400" />
              </div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-widest">Join 500+ Savvy Investors</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}