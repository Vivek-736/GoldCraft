"use client";

import { useState } from "react";
import {
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createGoldPurchaseOrder,
  verifyGoldPurchase,
  sellGold
} from "@/app/actions/gold-investment";
import { useRouter } from "next/navigation";

type TradeModalProps = {
  type: "BUY" | "SELL";
  livePriceState: { gram: number; success: boolean };
  userGrams: number;
};

const PRESET_AMOUNTS = [500, 1000, 5000, 10000];

export function TradeModal({ type, livePriceState, userGrams }: TradeModalProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [inrAmount, setInrAmount] = useState<string>("1000");
  const [loading, setLoading] = useState(false);

  const currentPrice = livePriceState.gram || 1;
  const numericInr = parseFloat(inrAmount) || 0;

  const calculatedGrams = numericInr > 0 ? (numericInr / currentPrice).toFixed(6) : "0.000000";
  const userGoldValue = userGrams * currentPrice;

  const handleAction = async () => {
    if (numericInr <= 0) {
      toast.error("Please enter a valid investment amount.");
      return;
    }

    if (type === "SELL" && parseFloat(calculatedGrams) > userGrams) {
      toast.error(`Insufficient gold balance. You only have ${userGrams.toFixed(4)}g. (≈ ₹${userGoldValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })})`);
      return;
    }

    setLoading(true);

    try {
      if (type === "BUY") {
        const orderRes = await createGoldPurchaseOrder(numericInr);
        if (!orderRes.success) throw new Error(orderRes.error);

        const options = {
          key: orderRes.key,
          // @ts-ignore
          amount: Math.round(orderRes.amount * 100),
          currency: "INR",
          name: "GoldCraft Reserve",
          description: `Purchase of ≈ ${calculatedGrams}g 24K Digital Gold`,
          order_id: orderRes.orderId,
          handler: async (response: any) => {
            const verifyRes = await verifyGoldPurchase(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verifyRes.success) {
              toast.success(`Successfully added ≈ ${calculatedGrams}g of gold to your vault!`);
              setIsOpen(false);
              router.refresh();
            } else {
              toast.error("Payment verification failed. If deducted, it will be refunded.");
            }
          },
          prefill: {
            name: "GoldCraft Investor",
          },
          theme: {
            color: "#D4A95A",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        const sellRes = await sellGold(numericInr);
        if (sellRes.success) {
          toast.success(`Successfully liquidated ≈ ${calculatedGrams}g. ₹${numericInr.toLocaleString('en-IN')} has been credited.`);
          setIsOpen(false);
          router.refresh();
        } else {
          toast.error(sellRes.error);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className={cn(
              "h-12 w-full cursor-pointer gap-2 rounded-2xl font-semibold shadow-[0_8px_20px_rgba(212,169,90,0.15)] transition-all",
              type === "BUY"
                ? "bg-linear-to-r from-[#E6C27A] to-[#D4A95A] text-slate-950 hover:brightness-105 border-0 hover:-translate-y-0.5"
                : "border border-amber-200 bg-white/50 backdrop-blur text-amber-600 hover:bg-white hover:border-amber-300 hover:-translate-y-0.5"
            )}
          >
            {type === "BUY" ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            {type === "BUY" ? "Invest Now" : "Liquidate"}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-sm border-amber-100 bg-white p-0 overflow-hidden rounded-3xl shadow-[0_0_60px_rgba(212,169,90,0.15)] text-slate-900">
          <div className="absolute top-0 inset-x-0 h-40 bg-linear-to-b from-amber-100/50 to-transparent pointer-events-none" />

          <div className="px-6 py-6 border-b border-slate-100 relative z-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif text-slate-900 tracking-tight flex items-center gap-2">
                {type === "BUY" ? "Start Investment" : "Liquidate Assets"}
              </DialogTitle>
              <p className="text-slate-500 text-xs mt-1 font-medium">99.9% 24K Pure Digital Gold</p>
            </DialogHeader>
          </div>

          <div className="px-6 py-6 space-y-6 relative z-10">
            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-amber-600/70 font-bold mb-0.5">Live Index</p>
                <p className="text-sm font-semibold text-slate-800">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(currentPrice)}/g
                </p>
              </div>
              <div className="h-8 w-px bg-slate-200 mx-2"></div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-amber-600/70 font-bold mb-0.5">You Have</p>
                <p className="text-sm font-semibold text-slate-800">{userGrams.toFixed(4)} g</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Amount to {type === "BUY" ? "Invest" : "Sell"} (INR)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-amber-500 font-serif text-xl sm:text-2xl">₹</span>
                </div>
                <Input
                  type="number"
                  value={inrAmount}
                  onChange={(e) => setInrAmount(e.target.value)}
                  className="pl-10 h-16 text-2xl font-semibold bg-white border-slate-200 rounded-2xl focus-visible:ring-amber-500/30 focus-visible:border-amber-400 shadow-inner text-slate-900 placeholder:text-slate-400 transition-all font-sans"
                  placeholder="0"
                  min="1"
                />
              </div>

              <div className="flex justify-between items-center px-2 py-0.5">
                <p className="text-sm font-medium text-slate-500">Estimated value:</p>
                <p className="text-sm font-bold text-amber-500 flex items-center gap-1">
                  ≈ {calculatedGrams} <span className="text-amber-600">g</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setInrAmount(amt.toString())}
                    className={cn(
                      "flex-1 min-w-16 py-2 rounded-xl text-xs font-semibold border transition-all duration-300",
                      numericInr === amt
                        ? "bg-amber-100/50 border-amber-400 text-amber-700 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600"
                    )}
                  >
                    +₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleAction}
                disabled={loading || numericInr <= 0}
                className={cn(
                  "h-14 w-full rounded-2xl text-[15px] font-bold shadow-lg transition-all",
                  type === "BUY"
                    ? "bg-linear-to-r from-[#E6C27A] to-[#D4A95A] text-slate-950 hover:brightness-110 active:scale-95 border-0 hover:shadow-[0_4px_15px_rgba(212,169,90,0.3)]"
                    : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95 border-0"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-900" />
                    Processing Securely...
                  </>
                ) : (
                  <>
                    {type === "BUY" ? "Authorize Purchase" : "Confirm Liquidation"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-1 opacity-60">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-[10px] uppercase tracking-widest text-slate-400">PCI DSS SECURE / 256-BIT ENCRYPTED</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}