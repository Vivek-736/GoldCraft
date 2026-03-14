"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ImageIcon,
  Loader2,
  PlusCircle,
  ShoppingBag,
  Sparkles,
  Upload,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type AIDesignStudioEditorProps = {
  mode: "upload" | "design";
};

type UploadedSketchResponse = {
  fileName: string;
  fileUrl: string;
};

type CreditBalanceResponse = {
  credits?: number;
  error?: string;
};

type CreditsConsumeResponse = {
  credits?: number;
  consumed?: number;
  error?: string;
};

type CreditsOrderResponse = {
  keyId?: string;
  order?: { id: string; amount: number; currency: string };
  amountInr?: number;
  credits?: number;
  error?: string;
};

type CreditsVerifyResponse = {
  success?: boolean;
  credits?: number;
  creditsAdded?: number;
  error?: string;
};

const PUTER_PROVIDER = "gemini";
const PUTER_IMAGE_MODEL = "gemini-2.5-flash-image-preview";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function toneForCredits(credits: number) {
  if (credits <= 1) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (credits <= 2) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
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

function readErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

function buildRenderPrompt({
  mode,
  prompt,
}: {
  mode: "upload" | "design";
  prompt?: string | null;
}) {
  const promptSuffix = prompt?.trim()
    ? `Additional design guidance: ${prompt.trim()}`
    : "Additional design guidance: none.";

  if (mode === "upload") {
    return [
      "Transform the provided jewelry sketch into a refined 3D gold jewelry visualization.",
      "Preserve the original silhouette, proportions, and design intent from the sketch.",
      "Render polished gold material, realistic depth, clean studio lighting, and a soft luxury off-white background.",
      "Keep the composition centered and premium with no text, props, watermark, or extra objects.",
      promptSuffix,
    ].join(" ");
  }

  return [
    "Create a refined 3D gold jewelry visualization from the description.",
    "Use polished gold materials, realistic depth, soft studio lighting, and a luxury off-white background.",
    "Keep the composition centered and premium with no text, props, watermark, or extra objects.",
    promptSuffix,
  ].join(" ");
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read the image."));
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) {
    return url;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  return blobToDataUrl(await response.blob());
}

async function generateStudioImage({
  mode,
  prompt,
  sourceImage,
}: {
  mode: "upload" | "design";
  prompt?: string | null;
  sourceImage?: string | null;
}) {
  const { default: puter } = await import("@heyputer/puter.js");
  const renderPrompt = buildRenderPrompt({ mode, prompt });

  if (mode === "upload") {
    if (!sourceImage) {
      throw new Error("Upload a sketch before generating.");
    }

    const dataUrl = await fetchAsDataUrl(sourceImage);
    const [header, base64Data] = dataUrl.split(",");
    const mimeType = header?.split(";")[0]?.split(":")[1];

    if (!mimeType || !base64Data) {
      throw new Error("Invalid sketch image payload.");
    }

    const response = (await puter.ai.txt2img(renderPrompt, {
      provider: PUTER_PROVIDER,
      model: PUTER_IMAGE_MODEL,
      input_image: base64Data,
      input_image_mime_type: mimeType,
      ratio: { w: 1024, h: 1024 },
    })) as HTMLImageElement;

    const rawImageUrl = response?.src ?? null;

    if (!rawImageUrl) {
      throw new Error("The image generator did not return a preview.");
    }

    return fetchAsDataUrl(rawImageUrl);
  }

  const response = (await puter.ai.txt2img(renderPrompt, {
    provider: PUTER_PROVIDER,
    model: PUTER_IMAGE_MODEL,
    ratio: { w: 1024, h: 1024 },
  })) as HTMLImageElement;

  const rawImageUrl = response?.src ?? null;

  if (!rawImageUrl) {
    throw new Error("The image generator did not return a preview.");
  }

  return fetchAsDataUrl(rawImageUrl);
}

function readGenerationError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Failed to generate the design.";
}

function readSavedOutputUrl(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "outputUrl" in payload &&
    typeof payload.outputUrl === "string"
  ) {
    return payload.outputUrl;
  }

  return null;
}

export function AIDesignStudioEditor({ mode }: AIDesignStudioEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [prompt, setPrompt] = useState("");
  const [sketchUrl, setSketchUrl] = useState<string | null>(null);
  const [sketchDataUrl, setSketchDataUrl] = useState<string | null>(null);
  const [sketchName, setSketchName] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);
  const [credits, setCredits] = useState<number>(4);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [savedToCart, setSavedToCart] = useState(false);

  const previewUrl = outputUrl ?? sketchDataUrl ?? sketchUrl;
  const canGenerate =
    mode === "upload"
      ? Boolean(sketchDataUrl ?? sketchUrl) && !isUploading && !isGenerating
      : prompt.trim().length > 0 && !isGenerating;
  const canSave = Boolean(outputUrl) && !isSaving;

  async function loadCredits() {
    try {
      const response = await fetch("/api/credits/balance", {
        cache: "no-store",
      });
      const payload = (await response.json()) as CreditBalanceResponse;

      if (response.ok && Number.isFinite(payload.credits)) {
        setCredits(Number(payload.credits));
      }
    } catch {
      // Ignore non-blocking credits load failure.
    }
  }

  async function consumeCreditOrThrow() {
    const response = await fetch("/api/credits/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ai-design-generate" }),
    });

    const payload = (await response.json()) as CreditsConsumeResponse;

    if (!response.ok) {
      if (Number.isFinite(payload.credits)) {
        setCredits(Number(payload.credits));
      }

      if (response.status === 402) {
        setShowCreditsDialog(true);
      }

      throw new Error(readErrorMessage(payload, "Not enough credits."));
    }

    if (Number.isFinite(payload.credits)) {
      setCredits(Number(payload.credits));
    }
  }

  async function buyCredits(creditsToBuy: number) {
    setIsBuyingCredits(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout.");
      }

      const orderResponse = await fetch("/api/credits/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credits: creditsToBuy,
        }),
      });

      const orderPayload = (await orderResponse.json()) as CreditsOrderResponse;

      if (!orderResponse.ok || !orderPayload.keyId || !orderPayload.order) {
        throw new Error(
          orderPayload.error ?? "Unable to start credits checkout.",
        );
      }

      const razorpay = new window.Razorpay({
        key: orderPayload.keyId,
        amount: orderPayload.order.amount,
        currency: orderPayload.order.currency,
        name: "GoldCraft Credits",
        description: `Buy ${creditsToBuy} credit${creditsToBuy > 1 ? "s" : ""}`,
        order_id: orderPayload.order.id,
        theme: {
          color: "#b45309",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyResponse = await fetch("/api/credits/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          const verifyPayload =
            (await verifyResponse.json()) as CreditsVerifyResponse;

          if (!verifyResponse.ok || !verifyPayload.success) {
            throw new Error(
              verifyPayload.error ??
                "Payment verified but credits update failed.",
            );
          }

          if (Number.isFinite(verifyPayload.credits)) {
            setCredits(Number(verifyPayload.credits));
          }

          setShowCreditsDialog(false);
          toast.success(
            `${verifyPayload.creditsAdded ?? creditsToBuy} credit${(verifyPayload.creditsAdded ?? creditsToBuy) > 1 ? "s" : ""} added.`,
          );
        },
      });

      razorpay.open();
    } catch (purchaseError) {
      const purchaseMessage =
        purchaseError instanceof Error
          ? purchaseError.message
          : "Unable to buy credits right now.";
      setError(purchaseMessage);
      toast.error(purchaseMessage);
    } finally {
      setIsBuyingCredits(false);
    }
  }

  async function handleUpload(file: File) {
    setIsUploading(true);
    setError(null);
    setMessage(null);
    setOutputUrl(null);
    setSavedToCart(false);

    try {
      const localDataUrl = await blobToDataUrl(file);
      setSketchDataUrl(localDataUrl);
      setSketchName(file.name);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai-design-studio/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          readErrorMessage(payload, "Failed to upload the sketch."),
        );
      }

      const uploaded = payload as UploadedSketchResponse;
      setSketchUrl(uploaded.fileUrl);
      setSketchName(uploaded.fileName);
      setMessage("Sketch uploaded. You can generate the visual now.");
      toast.success("Sketch uploaded successfully.");
    } catch (uploadError) {
      const uploadMessage =
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload the sketch.";
      setError(uploadMessage);
      toast.error(uploadMessage);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setMessage(null);
    setSavedToCart(false);

    try {
      await consumeCreditOrThrow();

      const generatedImage = await generateStudioImage({
        mode,
        prompt,
        sourceImage: sketchDataUrl ?? sketchUrl,
      });

      setOutputUrl(generatedImage);
      setMessage(
        mode === "upload"
          ? "3D visualization ready. Save it to cart if you want to keep it."
          : "Design visual ready. Save it to cart if you want to keep it.",
      );
      toast.success("Design generated.");
    } catch (generationError) {
      const generationMessage = readGenerationError(generationError);
      setError(generationMessage);
      toast.error(generationMessage);
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    void loadCredits();
  }, []);

  async function handleSaveToCart() {
    if (!outputUrl) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/ai-design-studio/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          prompt,
          sketchUrl,
          outputUrl,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          readErrorMessage(payload, "Failed to save this design."),
        );
      }

      const persistedOutputUrl = readSavedOutputUrl(payload);

      if (persistedOutputUrl) {
        setOutputUrl(persistedOutputUrl);
      }

      setSavedToCart(true);
      setMessage("Saved to cart.");
      toast.success("Saved to cart.");
    } catch (saveError) {
      const saveMessage =
        saveError instanceof Error
          ? saveError.message
          : "Failed to save this design.";
      setError(saveMessage);
      toast.error(saveMessage);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-2">
      <Card className="flex h-full min-h-0 min-w-0 flex-col rounded-[1.9rem] border-amber-200/90 bg-[#fffdf8] shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
        <CardHeader className="px-6 py-5 md:px-8 md:py-6">
          <CardTitle className="text-2xl text-slate-950">
            {mode === "upload" ? "Upload" : "Prompt"}
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-600">
            {mode === "upload"
              ? "Upload a sketch and optionally guide the render."
              : "Describe the jewelry piece and generate a visual."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 md:px-8 md:pb-8">
          {mode === "upload" ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    void handleUpload(file);
                  }

                  event.currentTarget.value = "";
                }}
              />

              <div className="flex min-h-55 w-full flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-amber-200 bg-amber-50/35 px-6 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white text-amber-800 shadow-sm">
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-950">
                  {sketchDataUrl || sketchUrl
                    ? "Sketch ready"
                    : "Drop image here"}
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                  {sketchName ?? "Drag and drop or choose a file."}
                </p>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mt-5 rounded-full bg-slate-900 px-6 text-white shadow-sm transition-colors hover:bg-slate-800"
                >
                  {isUploading ? "Uploading..." : "Choose File"}
                </Button>
              </div>

              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-medium text-slate-700">
                  Optional suggestion
                </p>
                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Add a short prompt or styling note for this sketch."
                  className="mt-3 min-h-24 rounded-3xl border-slate-200 bg-white text-sm shadow-none focus-visible:ring-amber-200"
                />
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-90 w-full flex-1 flex-col rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 lg:min-h-0">
              <p className="text-sm font-medium text-slate-700">Prompt</p>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Elegant 22k gold necklace with a modern lotus motif."
                className="mt-4 min-h-55 flex-1 rounded-[1.1rem] border-slate-200 bg-white text-sm shadow-none focus-visible:ring-amber-200 lg:min-h-0"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.12em] ${toneForCredits(credits)}`}
            >
              {credits} Credits
            </div>

            <Button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!canGenerate}
              className="rounded-full bg-slate-900 px-6 text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : mode === "upload" ? (
                "Generate 3D Visual"
              ) : (
                "Generate Visual"
              )}
            </Button>

            {savedToCart ? (
              <Button
                asChild
                variant="outline"
                className="rounded-full border-amber-200 bg-white"
              >
                <Link href="/dashboard/cart">View Cart</Link>
              </Button>
            ) : null}
          </div>

          {message ? (
            <p className="text-sm text-emerald-700">{message}</p>
          ) : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="flex h-full min-h-0 min-w-0 flex-col rounded-[1.9rem] border-slate-200 bg-slate-50/80 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
        <CardHeader className="px-6 py-5 md:px-8 md:py-6">
          <CardTitle className="text-2xl text-slate-950">Preview</CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-600">
            {outputUrl
              ? "Generated result"
              : mode === "upload" && (sketchDataUrl || sketchUrl)
                ? "Uploaded sketch"
                : "Your visual will appear here"}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 md:px-8 md:pb-8">
          <div className="flex h-full min-h-90 w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={
                  outputUrl
                    ? "Generated jewelry visual"
                    : "Uploaded sketch preview"
                }
                className="h-full max-h-105 w-full rounded-[1.2rem] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-slate-100 text-slate-500">
                  {mode === "upload" ? (
                    <ImageIcon className="h-7 w-7" />
                  ) : (
                    <Sparkles className="h-7 w-7" />
                  )}
                </div>
                <p className="mt-5 text-sm font-medium text-slate-700">
                  {mode === "upload"
                    ? "No preview yet"
                    : "Nothing generated yet"}
                </p>
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={() => void handleSaveToCart()}
            disabled={!canSave}
            className="rounded-full bg-amber-500 px-6 text-white shadow-sm transition-colors hover:bg-amber-400 disabled:bg-amber-200"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                Save to Cart
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog}>
        <DialogContent className="border-amber-200 bg-[#fffdf8] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insufficient credits</DialogTitle>
            <DialogDescription>
              You need credits to generate visuals. One generation uses one
              credit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-sm text-amber-900">
            <p>
              Current balance:{" "}
              <span className="font-semibold">{credits} credits</span>
            </p>
            <p>
              Pricing: <span className="font-semibold">₹100 per credit</span>
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void buyCredits(1);
              }}
              disabled={isBuyingCredits}
              className="rounded-full border-amber-200"
            >
              <PlusCircle className="h-4 w-4" />
              Buy 1 Credit (₹100)
            </Button>
            <Button
              type="button"
              onClick={() => {
                void buyCredits(4);
              }}
              disabled={isBuyingCredits}
              className="rounded-full bg-amber-800 text-white hover:bg-amber-900"
            >
              <PlusCircle className="h-4 w-4" />
              Buy 4 Credits (₹400)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}