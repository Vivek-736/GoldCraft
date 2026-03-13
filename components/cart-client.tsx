"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowLeft, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CartItem = {
  id: number;
  mode: string;
  prompt: string | null;
  outputUrl: string;
  estimatedCostInr: number | null;
  estimatedWeightGrams: string | null;
  estimateMeta: string | null;
  orderPlaced: boolean;
  orderPlacedAt: Date | string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
};

type CartClientProps = {
  initialItems: CartItem[];
  profileComplete: boolean;
  userName: string;
  userEmail: string;
  userPhone: string;
};

type GoldRateResponse = {
  gram: number;
  tenGram: number;
};

type PuterEstimate = {
  estimatedCostInr?: number;
  summary?: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function readPuterTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }

        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

function extractJsonObject(text: string): PuterEstimate | null {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]) as PuterEstimate;
  } catch {
    return null;
  }
}

function calculateFormulaEstimate({
  goldRatePerGram,
  weightGrams,
  karat,
  makingChargePercent,
  wastagePercent,
}: {
  goldRatePerGram: number;
  weightGrams: number;
  karat: number;
  makingChargePercent: number;
  wastagePercent: number;
}) {
  const purityFactor = karat / 24;
  const baseMetalCost = goldRatePerGram * weightGrams * purityFactor;
  const makingCharge = (baseMetalCost * makingChargePercent) / 100;
  const wastageCost = (baseMetalCost * wastagePercent) / 100;

  return Math.round(baseMetalCost + makingCharge + wastageCost);
}

async function loadRazorpayScript() {
  if (window.Razorpay) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CartClient({
  initialItems,
  profileComplete,
  userName,
  userEmail,
  userPhone,
}: CartClientProps) {
  type CheckoutMode = "all" | "selected";

  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("all");
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [estimateItem, setEstimateItem] = useState<CartItem | null>(null);
  const [weightGrams, setWeightGrams] = useState("10");
  const [karat, setKarat] = useState("22");
  const [makingChargePercent, setMakingChargePercent] = useState("12");
  const [wastagePercent, setWastagePercent] = useState("3");
  const [isEstimating, setIsEstimating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const successBackdropRef = useRef<HTMLDivElement | null>(null);
  const successTickRef = useRef<HTMLDivElement | null>(null);
  const successTitleRef = useRef<HTMLHeadingElement | null>(null);
  const successSubtitleRef = useRef<HTMLParagraphElement | null>(null);
  const successTagRef = useRef<HTMLDivElement | null>(null);

  const totalItems = items.length;
  
  const estimatedItems = items.filter(
    (item) => (item.estimatedCostInr ?? 0) > 0,
  ).length;

  const approxTotal = useMemo(
    () =>
      items.reduce((acc, item) => {
        return acc + (item.estimatedCostInr ?? 0);
      }, 0),
    [items],
  );

  const checkoutItems = useMemo(() => {
    const unplacedItems = items.filter((item) => !item.orderPlaced);

    if (checkoutMode === "all") {
      return unplacedItems;
    }

    const selectedSet = new Set(selectedItemIds);
    return unplacedItems.filter((item) => selectedSet.has(item.id));
  }, [checkoutMode, items, selectedItemIds]);

  const checkoutTotalItems = checkoutItems.length;
  const checkoutApproxTotal = useMemo(
    () =>
      checkoutItems.reduce((acc, item) => {
        return acc + (item.estimatedCostInr ?? 0);
      }, 0),
    [checkoutItems],
  );

  const selectedEstimate = useMemo(() => {
    if (!estimateItem?.id) {
      return null;
    }

    return items.find((item) => item.id === estimateItem.id) ?? null;
  }, [estimateItem?.id, items]);

  useEffect(() => {
    if (!showSuccessDialog) {
      return;
    }

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    timeline
      .fromTo(
        successBackdropRef.current,
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 0.08, y: 0, scale: 1, duration: 0.6 },
      )
      .fromTo(
        successTickRef.current,
        { opacity: 0, scale: 0.35, y: 22, rotate: -10 },
        { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 0.55 },
        "-=0.35",
      )
      .fromTo(
        successTitleRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35 },
        "-=0.2",
      )
      .fromTo(
        successSubtitleRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35 },
        "-=0.2",
      )
      .fromTo(
        successTagRef.current,
        { opacity: 0, scale: 0.9, y: 8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3 },
        "-=0.15",
      );

    return () => {
      timeline.kill();
    };
  }, [showSuccessDialog]);

  const openEstimateDialog = (item: CartItem) => {
    setEstimateItem(item);
    setWeightGrams(item.estimatedWeightGrams ?? "10");
    setKarat("22");
    setMakingChargePercent("12");
    setWastagePercent("3");
    setError(null);
    setMessage(null);
  };

  const runEstimate = async () => {
    if (!estimateItem) {
      return;
    }

    const parsedWeight = Number(weightGrams);
    const parsedKarat = Number(karat);
    const parsedMaking = Number(makingChargePercent);
    const parsedWastage = Number(wastagePercent);

    if (
      !Number.isFinite(parsedWeight) ||
      parsedWeight <= 0 ||
      !Number.isFinite(parsedKarat) ||
      parsedKarat <= 0 ||
      !Number.isFinite(parsedMaking) ||
      parsedMaking < 0 ||
      !Number.isFinite(parsedWastage) ||
      parsedWastage < 0
    ) {
      setError("Please enter valid estimation inputs.");
      return;
    }

    setIsEstimating(true);
    setError(null);
    setMessage(null);

    try {
      const goldRateResponse = await fetch("/api/gold-price", {
        cache: "no-store",
      });
      const goldRatePayload =
        (await goldRateResponse.json()) as GoldRateResponse & {
          error?: string;
        };

      if (!goldRateResponse.ok || !Number.isFinite(goldRatePayload.gram)) {
        throw new Error(
          goldRatePayload.error ?? "Unable to fetch current gold rate.",
        );
      }

      const formulaEstimate = calculateFormulaEstimate({
        goldRatePerGram: goldRatePayload.gram,
        weightGrams: parsedWeight,
        karat: parsedKarat,
        makingChargePercent: parsedMaking,
        wastagePercent: parsedWastage,
      });

      const { default: puter } = await import("@heyputer/puter.js");
      const estimationPrompt = [
        "Estimate Indian jewellery selling price in INR using given inputs.",
        "Return ONLY strict JSON with keys: estimatedCostInr (number), summary (string).",
        `Gold rate per gram INR: ${goldRatePayload.gram.toFixed(2)}`,
        `Weight grams: ${parsedWeight}`,
        `Karat: ${parsedKarat}`,
        `Making charge percent: ${parsedMaking}`,
        `Wastage percent: ${parsedWastage}`,
        `Design context: ${estimateItem.prompt?.trim() || "No prompt provided."}`,
        `Formula baseline estimate INR: ${formulaEstimate}`,
        "Keep estimate rough and realistic for premium handcrafted jewellery.",
      ].join("\n");

      const aiResponse = await puter.ai.chat(estimationPrompt, {
        model: "gemini-2.5-flash",
        temperature: 0.2,
      });

      const textContent = readPuterTextContent(aiResponse?.message?.content);
      const parsedAi = extractJsonObject(textContent);
      const estimatedCostInr = Math.round(
        Number(parsedAi?.estimatedCostInr) > 0
          ? Number(parsedAi?.estimatedCostInr)
          : formulaEstimate,
      );

      const estimateMeta = JSON.stringify({
        source: "puter-gemini",
        model: "gemini-2.5-flash",
        summary:
          typeof parsedAi?.summary === "string" && parsedAi.summary.trim()
            ? parsedAi.summary.trim()
            : "AI provided a rough estimate based on current gold spot rate and craftsmanship factors.",
        assumptions: {
          goldRatePerGram: goldRatePayload.gram,
          tenGramRate: goldRatePayload.tenGram,
          weightGrams: parsedWeight,
          karat: parsedKarat,
          makingChargePercent: parsedMaking,
          wastagePercent: parsedWastage,
          formulaEstimate,
        },
      });

      const saveResponse = await fetch(
        `/api/ai-design-studio/cart/${estimateItem.id}/estimate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estimatedCostInr,
            estimatedWeightGrams: String(parsedWeight),
            estimateMeta,
          }),
        },
      );

      const savePayload = (await saveResponse.json()) as {
        error?: string;
        item?: CartItem;
      };

      if (!saveResponse.ok || !savePayload.item) {
        throw new Error(savePayload.error ?? "Unable to save estimate.");
      }

      setItems((current) =>
        current.map((item) =>
          item.id === savePayload.item?.id ? savePayload.item : item,
        ),
      );
      setMessage(`Rough estimate saved: ${formatINR(estimatedCostInr)}.`);
    } catch (estimateError) {
      setError(
        estimateError instanceof Error
          ? estimateError.message
          : "Unable to estimate cost right now.",
      );
    } finally {
      setIsEstimating(false);
    }
  };

  const handleCheckout = async () => {
    if (!profileComplete) {
      setShowProfilePrompt(true);
      return;
    }

    if (!checkoutTotalItems) {
      setError(
        checkoutMode === "selected"
          ? "Select at least one cart item to checkout."
          : "No cart items available for checkout.",
      );
      return;
    }

    if (checkoutApproxTotal <= 0) {
      setError("Please estimate at least one selected design before checkout.");
      return;
    }

    setIsCheckingOut(true);
    setError(null);
    setMessage(null);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout.");
      }

      const orderResponse = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountInr: checkoutApproxTotal,
          receipt: `cart_${Date.now()}`,
        }),
      });

      const orderPayload = (await orderResponse.json()) as {
        error?: string;
        keyId?: string;
        order?: { id: string; amount: number; currency: string };
      };

      if (!orderResponse.ok || !orderPayload.order || !orderPayload.keyId) {
        throw new Error(orderPayload.error ?? "Unable to start checkout.");
      }

      const razorpay = new window.Razorpay({
        key: orderPayload.keyId,
        amount: orderPayload.order.amount,
        currency: orderPayload.order.currency,
        name: "GoldCraft",
        description: `Checkout for ${checkoutTotalItems} item(s)`,
        order_id: orderPayload.order.id,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
        },
        notes: {
          source: "goldcraft-cart",
          totalItems: checkoutTotalItems,
          checkoutMode,
        },
        theme: {
          color: "#b45309",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyResponse = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              itemIds: checkoutItems.map((item) => item.id),
            }),
          });

          const verifyPayload = (await verifyResponse.json()) as {
            error?: string;
          };

          if (!verifyResponse.ok) {
            throw new Error(
              verifyPayload.error ?? "Payment verification failed.",
            );
          }

          setItems((current) =>
            current.map((item) =>
              checkoutItems.some((checkoutItem) => checkoutItem.id === item.id)
                ? {
                    ...item,
                    orderPlaced: true,
                    orderPlacedAt: new Date().toISOString(),
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                  }
                : item,
            ),
          );
          setSelectedItemIds([]);

          setShowSuccessDialog(true);
          setMessage("Payment successful. Your order has been placed.");
        },
      });

      razorpay.open();
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to complete checkout.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[1.6rem] border border-amber-200 bg-white p-4 shadow-[0_12px_35px_rgba(217,119,6,0.06)] md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex justify-start">
            <Button
              asChild
              variant="outline"
              className="rounded-full border-amber-200 bg-white text-amber-900 hover:bg-amber-50"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Your cart
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
              Saved designs: {totalItems}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Estimated items: {estimatedItems} • Approx total:{" "}
              {formatINR(approxTotal)}
            </p>
            <div className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50/60 p-1">
              <button
                type="button"
                onClick={() => {
                  setCheckoutMode("all");
                  setError(null);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                  checkoutMode === "all"
                    ? "bg-amber-800 text-white"
                    : "text-amber-800 hover:bg-amber-100"
                }`}
              >
                Whole cart
              </button>
              <button
                type="button"
                onClick={() => {
                  setCheckoutMode("selected");
                  setError(null);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                  checkoutMode === "selected"
                    ? "bg-amber-800 text-white"
                    : "text-amber-800 hover:bg-amber-100"
                }`}
              >
                Selected items
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Checkout target: {checkoutTotalItems} item(s) •{" "}
              {formatINR(checkoutApproxTotal)}
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCheckout}
              disabled={isCheckingOut || !items.length}
              className="rounded-full bg-amber-800 text-white hover:bg-amber-900"
            >
              {isCheckingOut ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Starting checkout
                </>
              ) : (
                "Checkout"
              )}
            </Button>
          </div>
        </div>
        {message ? (
          <p className="mt-3 text-sm text-emerald-700">{message}</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      {items.length ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden rounded-[1.8rem] border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]"
            >
              <CardContent className="p-4">
                {checkoutMode === "selected" ? (
                  <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={(event) => {
                        setSelectedItemIds((current) => {
                          if (event.target.checked) {
                            return current.includes(item.id)
                              ? current
                              : [...current, item.id];
                          }

                          return current.filter((id) => id !== item.id);
                        });
                      }}
                      className="h-4 w-4 rounded border-amber-300 text-amber-700"
                    />
                    Include in checkout
                  </label>
                ) : null}

                <button
                  type="button"
                  onClick={() => setPreviewImage(item.outputUrl)}
                  className="relative w-full overflow-hidden rounded-[1.3rem] border border-slate-200 bg-slate-50"
                >
                  {item.orderPlaced ? (
                    <span className="absolute left-3 top-3 z-10 inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-sm">
                      Order placed
                    </span>
                  ) : null}
                  <Image
                    src={item.outputUrl}
                    alt="Saved AI jewelry concept"
                    width={1024}
                    height={1024}
                    className="h-72 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                    unoptimized
                  />
                </button>

                <div className="mt-4 space-y-2">
                  <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                    {item.mode}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {item.prompt?.trim() || "Saved without a prompt."}
                  </p>
                  <p className="text-sm font-medium text-amber-900">
                    Approx cost:{" "}
                    {item.estimatedCostInr
                      ? formatINR(item.estimatedCostInr)
                      : "Not estimated yet"}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openEstimateDialog(item)}
                    className="rounded-full border-amber-200"
                  >
                    Estimate cost
                  </Button>
                  <Button
                    type="button"
                    onClick={() => openEstimateDialog(item)}
                    className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {item.estimatedCostInr
                      ? `Approx ${formatINR(item.estimatedCostInr)}`
                      : "View estimate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]">
          <CardHeader>
            <CardTitle>No saved AI designs yet</CardTitle>
            <CardDescription>
              Generate a design in the AI Design Studio and save it to cart to
              see it here.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Dialog
        open={Boolean(previewImage)}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-3xl border-amber-200 bg-[#fffdf8] p-3 sm:p-4">
          <DialogHeader className="sr-only">
            <DialogTitle>Cart item preview</DialogTitle>
            <DialogDescription>
              Preview of selected cart design image.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
            {previewImage ? (
              <Image
                src={previewImage}
                alt="Cart design preview"
                width={1400}
                height={1400}
                className="max-h-[78vh] w-full object-contain"
                unoptimized
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(estimateItem)}
        onOpenChange={(open) => {
          if (!open) {
            setEstimateItem(null);
          }
        }}
      >
        <DialogContent className="border-amber-200 bg-[#fffdf8] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rough jewellery cost estimate</DialogTitle>
            <DialogDescription>
              Uses live gold price, gram-based math, and GoldCraft AI to save an
              approximate value.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="weightGrams">Weight (grams)</Label>
              <Input
                id="weightGrams"
                type="number"
                min="0"
                value={weightGrams}
                onChange={(event) => setWeightGrams(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="karat">Purity (karat)</Label>
              <Input
                id="karat"
                type="number"
                min="1"
                max="24"
                value={karat}
                onChange={(event) => setKarat(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="makingPercent">Making charge %</Label>
              <Input
                id="makingPercent"
                type="number"
                min="0"
                value={makingChargePercent}
                onChange={(event) => setMakingChargePercent(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wastagePercent">Wastage %</Label>
              <Input
                id="wastagePercent"
                type="number"
                min="0"
                value={wastagePercent}
                onChange={(event) => setWastagePercent(event.target.value)}
              />
            </div>
          </div>

          {selectedEstimate?.estimatedCostInr ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Saved estimate: {formatINR(selectedEstimate.estimatedCostInr)}
            </p>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <DialogFooter>
            <Button
              onClick={runEstimate}
              disabled={isEstimating}
              className="rounded-full bg-amber-800 text-white hover:bg-amber-900"
            >
              {isEstimating ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Estimating
                </>
              ) : (
                "Save rough estimate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfilePrompt} onOpenChange={setShowProfilePrompt}>
        <DialogContent className="border-amber-200 bg-[#fffdf8] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete profile before checkout</DialogTitle>
            <DialogDescription>
              Add your phone number and address in profile so we can continue
              with purchase and delivery.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              asChild
              className="rounded-full bg-amber-800 text-white hover:bg-amber-900"
            >
              <Link href="/dashboard/profile">Go to profile</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="border-emerald-200 bg-white sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Checkout success</DialogTitle>
            <DialogDescription>
              Your payment was successful and order is placed.
            </DialogDescription>
          </DialogHeader>
          <div className="relative flex flex-col items-center justify-center overflow-hidden py-4 text-center">
            <div
              ref={successBackdropRef}
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-[52px] font-semibold uppercase tracking-[0.26em] text-emerald-700 opacity-0"
            >
              PAYMENT DONE
            </div>

            <div ref={successTickRef} className="relative">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-200" />
              <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-9 w-9" />
              </span>
            </div>

            <h3 ref={successTitleRef} className="mt-4 text-xl font-semibold text-slate-900">
              Payment successful
            </h3>
            <p ref={successSubtitleRef} className="mt-2 text-sm text-slate-600">
              Your checkout is confirmed. Our team will process your purchase
              shortly.
            </p>
            <div
              ref={successTagRef}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Order placed
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}