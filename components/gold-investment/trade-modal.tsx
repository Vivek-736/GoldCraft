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
  DialogFooter
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

export function TradeModal({ type, livePriceState, userGrams }: TradeModalProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [grams, setGrams] = useState<string>("1");
  const [loading, setLoading] = useState(false);

  const currentPrice = livePriceState.gram;
  const numericGrams = parseFloat(grams) || 0;
  const totalAmount = Math.round(numericGrams * currentPrice);

  const handleAction = async () => {
    if (numericGrams <= 0) {
      toast.error("Please enter a valid amount of grams.");
      return;
    }

    if (type === "SELL" && numericGrams > userGrams) {
      toast.error("Insufficient gold balance to sell.");
      return;
    }

    setLoading(true);

    try {
      if (type === "BUY") {
        const orderRes = await createGoldPurchaseOrder(numericGrams);
        if (!orderRes.success) throw new Error(orderRes.error);

        const options = {
          key: orderRes.key,
          // @ts-ignore
          amount: orderRes.amount * 100,
          currency: "INR",
          name: "GoldCraft Investment",
          description: `Purchase of ${grams}g 24K Digital Gold`,
          order_id: orderRes.orderId,
          handler: async (response: any) => {
            const verifyRes = await verifyGoldPurchase(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verifyRes.success) {
              toast.success(`Successfully purchased ${grams}g of gold!`);
              setIsOpen(false);
              router.refresh();
            } else {
              toast.error("Payment verification failed.");
            }
          },
          prefill: {
            name: "GoldCraft User",
          },
          theme: {
            color: "#d97706",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        const sellRes = await sellGold(numericGrams);
        if (sellRes.success) {
          toast.success(`Successfully sold ${grams}g of gold for ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(sellRes.amount as number)}!`);
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
            variant={type === "BUY" ? "default" : "outline"}
            className={cn(
              "h-12 w-full cursor-pointer gap-2 rounded-2xl font-semibold shadow-sm",
              type === "BUY"
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "border-amber-200 text-amber-800 hover:bg-amber-50"
            )}
          >
            {type === "BUY" ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            {type === "BUY" ? "Buy Digital Gold" : "Sell Gold"}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-sm border-amber-100 bg-white p-0 overflow-hidden rounded-3xl shadow-2xl">
          <div className="px-6 py-6 border-b border-stone-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif text-slate-900 tracking-tight">
                {type === "BUY" ? "Buy Digital Gold" : "Sell Digital Gold"}
              </DialogTitle>
              <p className="text-slate-500 text-xs mt-1">24K 99.9% Purity Certified</p>
            </DialogHeader>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="flex justify-between items-center px-4 py-3 bg-stone-50 rounded-2xl border border-stone-100">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Live Price</p>
                <p className="text-sm font-semibold text-slate-900">₹{currentPrice.toLocaleString()}/g</p>
              </div>
              <div className="h-6 w-px bg-stone-200" />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Balance</p>
                <p className="text-sm font-semibold text-slate-900">{userGrams.toFixed(3)}g</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 ml-1">
                Amount (Grams)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="h-14 rounded-2xl border-stone-200 bg-transparent pl-4 pr-12 text-lg font-medium text-slate-900 focus:border-amber-500 focus:ring-amber-500 shadow-none"
                  placeholder="0.00"
                  step="0.01"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">g</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Processing Fee</span>
                <span className="font-medium text-emerald-600 tracking-wide">Free</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-600 font-medium">Total Execution</span>
                <span className="text-2xl font-serif font-bold text-amber-700 tracking-tight">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-center gap-1.5 items-center text-[10px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure 256-bit encryption
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-0 border-none sm:justify-center">
            <Button
              onClick={handleAction}
              disabled={loading || numericGrams <= 0}
              className="h-12 w-full rounded-2xl bg-amber-700 text-base font-semibold text-white shadow-sm hover:bg-amber-800 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {type === "BUY" ? "Proceed" : "Confirm"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}