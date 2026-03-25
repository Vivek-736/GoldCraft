"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BuyCreditsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

async function loadRazorpayScript() {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function BuyCreditsDialog({ open, onOpenChange }: BuyCreditsDialogProps) {
  const [creditsToBuy, setCreditsToBuy] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const PRICE_PER_CREDIT = 100;

  const handleBuy = async () => {
    try {
      setIsProcessing(true);
      
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        alert("Failed to load payment gateway. Please check your connection.");
        setIsProcessing(false);
        return;
      }

      const orderRes = await fetch("/api/credits/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: creditsToBuy }),
      });
      
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        alert(orderData.error || "Failed to create order");
        setIsProcessing(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "GoldCraft credits",
        description: `Purchase ${creditsToBuy} credits`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/credits/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              alert(verifyData.error || "Payment verification failed");
              return;
            }

            window.dispatchEvent(new Event("credits:updated"));
            onOpenChange(false);
            setCreditsToBuy(1);
          } catch (err) {
            console.error(err);
            alert("Error verifying payment");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: "GoldCraft User",
        },
        theme: {
          color: "#d97706",
        },
      });

      razorpay.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy Design Credits</DialogTitle>
          <DialogDescription>
            You need credits to generate AI designs. Each credit costs ₹{PRICE_PER_CREDIT}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="credits">Number of Credits</Label>
            <Input 
              id="credits"
              type="number"
              min={1}
              max={20}
              value={creditsToBuy}
              onChange={(e) => setCreditsToBuy(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
            />
          </div>
          <div className="flex justify-between items-center text-sm font-medium bg-slate-50 p-3 rounded-md border border-slate-100">
            <span>Total Amount:</span>
            <span className="text-lg">₹{creditsToBuy * PRICE_PER_CREDIT}</span>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleBuy} disabled={isProcessing} className="bg-amber-600 hover:bg-amber-700 text-white">
            {isProcessing ? "Processing..." : `Pay ₹${creditsToBuy * PRICE_PER_CREDIT}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}