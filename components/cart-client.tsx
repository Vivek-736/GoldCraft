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
import { toast } from "sonner";

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

type EstimateBreakdown = {
  rate24kPerGram: number;
  rate22kPerGram: number;
  weightGrams: number;
  makingChargePercent: number;
  makingCharge: number;
  baseMetalCost22k: number;
  subTotal: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  complexityScore: number;
};

type ImageDesignMetrics = {
  complexityScore: number;
  coverageScore: number;
  toneVariance: number;
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

function roundCurrency(value: number) {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type JewelleryCategory =
  | "ring"
  | "earring"
  | "pendant"
  | "bracelet"
  | "necklace"
  | "generic";

function detectJewelleryCategory(text: string): JewelleryCategory {
  if (text.includes("ring")) {
    return "ring";
  }

  if (text.includes("earring") || text.includes("ear ring") || text.includes("stud")) {
    return "earring";
  }

  if (text.includes("pendant") || text.includes("locket")) {
    return "pendant";
  }

  if (text.includes("bracelet") || text.includes("bangle") || text.includes("kada")) {
    return "bracelet";
  }

  if (
    text.includes("necklace") ||
    text.includes("choker") ||
    text.includes("chain") ||
    text.includes("mangalsutra")
  ) {
    return "necklace";
  }

  return "generic";
}

function hashText(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

async function analyzeImageDesign(imageUrl: string): Promise<ImageDesignMetrics> {
  try {
    const response = await fetch(imageUrl, { cache: "no-store" });

    if (!response.ok) {
      return {
        complexityScore: 0.55,
        coverageScore: 0.45,
        toneVariance: 0.4,
      };
    }

    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const canvas = document.createElement("canvas");
    const width = 220;
    const height = 220;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      return {
        complexityScore: 0.55,
        coverageScore: 0.45,
        toneVariance: 0.4,
      };
    }

    context.drawImage(bitmap, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height).data;

    let edgeAccumulator = 0;
    let jewelryEdgeAccumulator = 0;
    let samples = 0;
    let jewelryPixelCount = 0;
    let luminanceSum = 0;
    let luminanceSqSum = 0;

    for (let y = 1; y < height; y += 2) {
      for (let x = 1; x < width; x += 2) {
        const index = (y * width + x) * 4;
        const leftIndex = (y * width + (x - 1)) * 4;
        const topIndex = ((y - 1) * width + x) * 4;

        const lum =
          0.2126 * imageData[index] +
          0.7152 * imageData[index + 1] +
          0.0722 * imageData[index + 2];

        const leftLum =
          0.2126 * imageData[leftIndex] +
          0.7152 * imageData[leftIndex + 1] +
          0.0722 * imageData[leftIndex + 2];

        const topLum =
          0.2126 * imageData[topIndex] +
          0.7152 * imageData[topIndex + 1] +
          0.0722 * imageData[topIndex + 2];

        const red = imageData[index] / 255;
        const green = imageData[index + 1] / 255;
        const blue = imageData[index + 2] / 255;
        const maxChannel = Math.max(red, green, blue);
        const minChannel = Math.min(red, green, blue);
        const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;

        const isJewelryPixel = lum < 242 || saturation > 0.06;

        if (isJewelryPixel) {
          jewelryPixelCount += 1;
          luminanceSum += lum;
          luminanceSqSum += lum * lum;
        }

        edgeAccumulator += Math.abs(lum - leftLum) + Math.abs(lum - topLum);

        if (isJewelryPixel) {
          jewelryEdgeAccumulator += Math.abs(lum - leftLum) + Math.abs(lum - topLum);
        }

        samples += 2;
      }
    }

    if (!samples) {
      return {
        complexityScore: 0.55,
        coverageScore: 0.45,
        toneVariance: 0.4,
      };
    }

    const totalPixels = (width / 2) * (height / 2);
    const coverageRaw = totalPixels > 0 ? jewelryPixelCount / totalPixels : 0.12;
    const coverageScore = clamp(coverageRaw * 4.2, 0.15, 0.98);

    const normalizedEdge = edgeAccumulator / (samples * 255);
    const jewelryEdgeNorm = jewelryPixelCount
      ? jewelryEdgeAccumulator / (jewelryPixelCount * 255 * 2)
      : normalizedEdge;

    const meanLum = jewelryPixelCount ? luminanceSum / jewelryPixelCount : 160;
    const variance = jewelryPixelCount
      ? Math.max(luminanceSqSum / jewelryPixelCount - meanLum * meanLum, 0)
      : 1500;
    const toneVariance = clamp(Math.sqrt(variance) / 80, 0.2, 0.95);

    const complexityScore = clamp(
      normalizedEdge * 0.35 + jewelryEdgeNorm * 0.35 + coverageScore * 0.2 + toneVariance * 0.1,
      0.2,
      0.98,
    );

    return {
      complexityScore: Number(complexityScore.toFixed(3)),
      coverageScore: Number(coverageScore.toFixed(3)),
      toneVariance: Number(toneVariance.toFixed(3)),
    };
  } catch {
    return {
      complexityScore: 0.55,
      coverageScore: 0.45,
      toneVariance: 0.4,
    };
  }
}

function estimateWeightFromDesign({
  designMetrics,
  mode,
  prompt,
  outputUrl,
}: {
  designMetrics: ImageDesignMetrics;
  mode: string;
  prompt: string | null;
  outputUrl: string;
}) {
  const text = `${mode} ${prompt ?? ""}`.toLowerCase();
  const category = detectJewelleryCategory(text);
  const signature = hashText(outputUrl);
  const perItemOffset = ((signature % 13) - 6) / 10;

  const ranges: Record<JewelleryCategory, { base: number; min: number; max: number }> = {
    ring: { base: 4.4, min: 2.8, max: 8.2 },
    earring: { base: 5.9, min: 3.5, max: 12.5 },
    pendant: { base: 6.7, min: 4.0, max: 15.0 },
    bracelet: { base: 12.0, min: 7.5, max: 28.0 },
    necklace: { base: 22.0, min: 12.0, max: 55.0 },
    generic: { base: 7.2, min: 4.2, max: 18.0 },
  };

  const selectedRange = ranges[category];

  const complexityNorm = clamp((designMetrics.complexityScore - 0.2) / 0.78, 0, 1);
  const coverageNorm = clamp((designMetrics.coverageScore - 0.15) / 0.83, 0, 1);
  const toneNorm = clamp((designMetrics.toneVariance - 0.2) / 0.75, 0, 1);

  let baseWeight =
    selectedRange.base +
    complexityNorm * 1.8 +
    coverageNorm * 1.9 +
    toneNorm * 0.9 +
    perItemOffset;

  if (text.includes("stone") || text.includes("diamond") || text.includes("kundan")) {
    baseWeight += category === "ring" ? 0.35 : 0.7;
  }

  if (text.includes("heavy") || text.includes("bridal") || text.includes("statement")) {
    baseWeight += category === "necklace" ? 2.8 : 1.4;
  }

  if (text.includes("minimal") || text.includes("sleek") || text.includes("lightweight") || text.includes("daily")) {
    baseWeight -= category === "necklace" ? 1.8 : 0.9;
  }

  return clamp(Number(baseWeight.toFixed(2)), selectedRange.min, selectedRange.max);
}

function deriveGoldRates(payload?: GoldRateResponse & { error?: string }) {
  const DEFAULT_24K = 16000;
  const DEFAULT_22K = 15000;

  const fromGram = Number(payload?.gram);
  const fromTenGram = Number(payload?.tenGram);

  let rate24 = Number.isFinite(fromGram) && fromGram > 10000
    ? fromGram
    : Number.isFinite(fromTenGram) && fromTenGram > 100000
      ? fromTenGram / 10
      : DEFAULT_24K;

  rate24 = Math.max(rate24, DEFAULT_24K);
  const rate22 = Math.max((rate24 * 22) / 24, DEFAULT_22K);

  return {
    rate24kPerGram: roundCurrency(rate24),
    rate22kPerGram: roundCurrency(rate22),
  };
}

function buildEstimateBreakdown({
  rate24kPerGram,
  rate22kPerGram,
  weightGrams,
  complexityScore,
  makingChargePercent,
}: {
  rate24kPerGram: number;
  rate22kPerGram: number;
  weightGrams: number;
  complexityScore: number;
  makingChargePercent: number;
}): EstimateBreakdown {
  const gstPercent = 3;

  const baseMetalCost22k = roundCurrency(rate22kPerGram * weightGrams);
  const makingCharge = roundCurrency((baseMetalCost22k * makingChargePercent) / 100);
  const subTotal = baseMetalCost22k + makingCharge;
  const gstAmount = roundCurrency((subTotal * gstPercent) / 100);
  const grandTotal = subTotal + gstAmount;

  return {
    rate24kPerGram,
    rate22kPerGram,
    weightGrams,
    makingChargePercent: Number(makingChargePercent.toFixed(1)),
    makingCharge,
    baseMetalCost22k,
    subTotal,
    gstPercent,
    gstAmount,
    grandTotal,
    complexityScore: Number(complexityScore.toFixed(3)),
  };
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
  const [estimateBreakdown, setEstimateBreakdown] =
    useState<EstimateBreakdown | null>(null);
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
    setEstimateBreakdown(null);
    setError(null);
    setMessage(null);
  };

  const runEstimate = async (itemArg?: CartItem) => {
    const targetItem = itemArg ?? estimateItem;

    if (!targetItem) {
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

      if (!goldRateResponse.ok) {
        throw new Error(
          goldRatePayload.error ?? "Unable to fetch current gold rate.",
        );
      }

      const designMetrics = await analyzeImageDesign(targetItem.outputUrl);
      const estimatedWeightGrams = estimateWeightFromDesign({
        designMetrics,
        mode: targetItem.mode,
        prompt: targetItem.prompt,
        outputUrl: targetItem.outputUrl,
      });

      const makingChargePercent = clamp(
        14 + designMetrics.complexityScore * 8 + designMetrics.coverageScore * 8,
        14,
        30,
      );

      const { rate24kPerGram, rate22kPerGram } = deriveGoldRates(goldRatePayload);

      const breakdown = buildEstimateBreakdown({
        rate24kPerGram,
        rate22kPerGram,
        weightGrams: estimatedWeightGrams,
        complexityScore: designMetrics.complexityScore,
        makingChargePercent,
      });

      const estimatedCostInr = breakdown.grandTotal;

      setEstimateBreakdown(breakdown);

      const estimateMeta = JSON.stringify({
        source: "goldcraft-auto-estimator",
        model: "formula+image-analysis",
        summary:
          "Auto-estimate based on analyzed design complexity, inferred gross weight, current 24k/22k rates, making charges, and GST.",
        assumptions: {
          coverageScore: designMetrics.coverageScore,
          toneVariance: designMetrics.toneVariance,
          complexityScore: breakdown.complexityScore,
          weightGrams: breakdown.weightGrams,
          rate24kPerGram: breakdown.rate24kPerGram,
          rate22kPerGram: breakdown.rate22kPerGram,
          makingChargePercent: breakdown.makingChargePercent,
          gstPercent: breakdown.gstPercent,
        },
      });

      const saveResponse = await fetch(
        `/api/ai-design-studio/cart/${targetItem.id}/estimate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estimatedCostInr,
            estimatedWeightGrams: String(breakdown.weightGrams),
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
      toast.success(`Estimate saved: ${formatINR(estimatedCostInr)}.`);
    } catch (estimateError) {
      const estimateErrorMessage =
        estimateError instanceof Error
          ? estimateError.message
          : "Unable to estimate cost right now.";
      setError(
        estimateErrorMessage,
      );
      toast.error(estimateErrorMessage);
    } finally {
      setIsEstimating(false);
    }
  };

  useEffect(() => {
    if (!estimateItem) {
      return;
    }

    void runEstimate(estimateItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateItem?.id]);

  const handleCheckout = async () => {
    if (!profileComplete) {
      setShowProfilePrompt(true);
      toast.info("Complete profile details before checkout.");
      return;
    }

    if (!checkoutTotalItems) {
      const checkoutCountMessage =
        checkoutMode === "selected"
          ? "Select at least one cart item to checkout."
          : "No cart items available for checkout.";
      setError(checkoutCountMessage);
      toast.error(checkoutCountMessage);
      return;
    }

    if (checkoutApproxTotal <= 0) {
      const checkoutEstimateMessage =
        "Please estimate at least one selected design before checkout.";
      setError(checkoutEstimateMessage);
      toast.error(checkoutEstimateMessage);
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
          toast.success("Payment done. Order placed successfully.");
        },
      });

      razorpay.open();
    } catch (checkoutError) {
      const checkoutErrorMessage =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to complete checkout.";
      setError(
        checkoutErrorMessage,
      );
      toast.error(checkoutErrorMessage);
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
        <DialogContent className="border-amber-200 bg-[#fffdf8] sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Rough jewellery cost estimate</DialogTitle>
            <DialogDescription>
              Auto-calculated from your design image + live gold rates with no manual inputs.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
              {estimateItem ? (
                <Image
                  src={estimateItem.outputUrl}
                  alt="Estimate design preview"
                  width={900}
                  height={900}
                  className="h-72 w-full object-cover"
                  unoptimized
                />
              ) : null}
              <div className="border-t border-amber-100 px-4 py-3 text-sm text-slate-600">
                {estimateItem?.prompt?.trim() || "AI jewelry design"}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                <span>Product details</span>
                <span className="text-center">Rate</span>
                <span className="text-center">Weight</span>
                <span className="text-center">%</span>
                <span className="text-right">Value</span>
              </div>

              {estimateBreakdown ? (
                <>
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] items-center border-b border-slate-200 px-4 py-4 text-sm text-slate-700">
                    <div>
                      <p className="font-semibold text-slate-900">Yellow Gold</p>
                      <p className="text-xs text-slate-500">22KT</p>
                    </div>
                    <p className="text-center font-medium">₹ {estimateBreakdown.rate22kPerGram}/g</p>
                    <p className="text-center font-medium">{estimateBreakdown.weightGrams.toFixed(2)}g</p>
                    <p className="text-center">-</p>
                    <p className="text-right font-semibold">₹ {estimateBreakdown.baseMetalCost22k.toLocaleString("en-IN")}</p>
                  </div>

                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] items-center border-b border-slate-200 px-4 py-3 text-sm text-slate-700">
                    <p>Making Charges</p>
                    <p className="text-center">-</p>
                    <p className="text-center">-</p>
                    <p className="text-center">{estimateBreakdown.makingChargePercent.toFixed(1)}%</p>
                    <p className="text-right font-semibold">₹ {estimateBreakdown.makingCharge.toLocaleString("en-IN")}</p>
                  </div>

                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] items-center border-b border-slate-200 px-4 py-3 text-sm text-slate-700">
                    <p>Sub Total</p>
                    <p className="text-center">-</p>
                    <p className="text-center">{estimateBreakdown.weightGrams.toFixed(2)}g Gross Wt.</p>
                    <p className="text-center">-</p>
                    <p className="text-right font-semibold">₹ {estimateBreakdown.subTotal.toLocaleString("en-IN")}</p>
                  </div>

                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] items-center border-b border-slate-200 px-4 py-3 text-sm text-slate-700">
                    <p>GST</p>
                    <p className="text-center">-</p>
                    <p className="text-center">-</p>
                    <p className="text-center">{estimateBreakdown.gstPercent}%</p>
                    <p className="text-right font-semibold">₹ {estimateBreakdown.gstAmount.toLocaleString("en-IN")}</p>
                  </div>

                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] items-center px-4 py-4 text-base font-semibold text-slate-900">
                    <p>Grand Total</p>
                    <p className="col-span-3 text-right text-sm font-normal text-slate-600">
                      24KT Ref: ₹ {estimateBreakdown.rate24kPerGram}/g
                    </p>
                    <p className="text-right text-2xl">₹ {estimateBreakdown.grandTotal.toLocaleString("en-IN")}</p>
                  </div>
                </>
              ) : (
                <div className="px-4 py-14 text-center text-sm text-slate-500">
                  {isEstimating ? "Analyzing design and calculating estimate..." : "Estimate will appear here."}
                </div>
              )}
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
              onClick={() => {
                void runEstimate();
              }}
              disabled={isEstimating}
              className="rounded-full bg-amber-800 text-white hover:bg-amber-900"
            >
              {isEstimating ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Recalculating
                </>
              ) : (
                "Recalculate & save"
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