"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ImageIcon,
  Languages,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  ShoppingBag,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type AIDesignStudioEditorProps = {
  mode: "upload" | "design";
};

type UploadedSketchResponse = {
  fileName: string;
  fileUrl: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GenerateResponse = {
  outputUrl?: string;
  error?: string;
};

type TtsResponse = {
  audioContent?: string;
  mimeType?: string;
  error?: string;
};

type ConsumeCreditsResponse = {
  credits?: number;
  consumed?: number;
  error?: string;
};

type BalanceResponse = {
  credits?: number;
  error?: string;
};

type PuterLikeResult = {
  url?: string;
  src?: string;
  image?: string;
  outputUrl?: string;
  data?: {
    url?: string;
    image?: string;
  };
};

type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onerror: ((event: { error?: string }) => void) | null;
};

type BrowserWindowWithSpeech = Window & {
  webkitSpeechRecognition?: new () => SpeechRecognitionType;
  SpeechRecognition?: new () => SpeechRecognitionType;
};

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

function buildBasePrompt({
  mode,
  prompt,
}: {
  mode: "upload" | "design";
  prompt: string;
}) {
  const promptSuffix = prompt.trim()
    ? `Additional design guidance: ${prompt.trim()}`
    : "Additional design guidance: none.";

  if (mode === "upload") {
    return [
      "Transform the provided jewelry sketch context into a refined 3D gold jewelry visualization.",
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

function languageToCode(language: string) {
  const normalized = language.toLowerCase();

  if (normalized.includes("hindi")) return "hi-IN";
  if (normalized.includes("telugu")) return "te-IN";
  if (normalized.includes("tamil")) return "ta-IN";
  if (normalized.includes("kannada")) return "kn-IN";
  if (normalized.includes("malayalam")) return "ml-IN";

  return "en-US";
}

const JEWELRY_KEYWORDS = [
  "jewelry",
  "jewellery",
  "ornament",
  "ring",
  "necklace",
  "pendant",
  "earring",
  "ear ring",
  "nose ring",
  "bangle",
  "bracelet",
  "anklet",
  "waist chain",
  "mangalsutra",
  "chain",
  "gold",
  "diamond",
  "gem",
  "stone",
  "kundan",
  "jhumka",
  "choker",
];

function isJewelryIntent(text: string) {
  const normalized = text.toLowerCase();
  return JEWELRY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function extractPuterChatText(payload: unknown): string {
  if (typeof payload === "string") {
    return payload.trim();
  }

  if (!payload || typeof payload !== "object") {
    return "";
  }

  if (
    "text" in payload &&
    typeof (payload as { text?: unknown }).text === "string"
  ) {
    return ((payload as { text: string }).text || "").trim();
  }

  if ("message" in payload) {
    const message = (payload as { message?: unknown }).message;

    if (message && typeof message === "object") {
      if (
        "content" in message &&
        typeof (message as { content?: unknown }).content === "string"
      ) {
        return ((message as { content: string }).content || "").trim();
      }

      const content =
        "content" in message
          ? (message as { content?: unknown }).content
          : null;
      if (Array.isArray(content)) {
        const joined = content
          .map((part) => {
            if (!part || typeof part !== "object") {
              return "";
            }

            return "text" in part &&
              typeof (part as { text?: unknown }).text === "string"
              ? (part as { text: string }).text
              : "";
          })
          .filter(Boolean)
          .join("\n")
          .trim();

        if (joined) {
          return joined;
        }
      }
    }
  }

  return "";
}

type PuterChatJsonResult = {
  reply: string;
  promptReady: boolean;
  prompt: string;
};

function parsePuterChatJson(text: string): PuterChatJsonResult | null {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[0]) as PuterChatJsonResult;

    if (
      typeof parsed.reply === "string" &&
      typeof parsed.promptReady === "boolean" &&
      typeof parsed.prompt === "string"
    ) {
      return {
        reply: parsed.reply.trim(),
        promptReady: parsed.promptReady,
        prompt: parsed.prompt.trim(),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function AIDesignStudioEditor({ mode }: AIDesignStudioEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionType | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

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
  const [savedToCart, setSavedToCart] = useState(false);

  const [designFlow, setDesignFlow] = useState<"plain" | "guided" | "chat">(
    "plain",
  );
  const [plainPrompt, setPlainPrompt] = useState("");
  const [isCorrectingPrompt, setIsCorrectingPrompt] = useState(false);

  const [guidedType, setGuidedType] = useState("ring");
  const [guidedStoneColor, setGuidedStoneColor] = useState("emerald green");
  const [guidedMetalTone, setGuidedMetalTone] = useState("yellow gold");
  const [guidedStyle, setGuidedStyle] = useState("minimal luxury");

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "What ornament would you like to create today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatPrompt, setChatPrompt] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatLanguage, setChatLanguage] = useState("English");
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);

  const previewUrl = outputUrl ?? sketchDataUrl ?? sketchUrl;
  const canSave = Boolean(outputUrl) && !isSaving;

  const canGenerate = useMemo(() => {
    if (mode === "upload") {
      return (
        Boolean(sketchDataUrl ?? sketchUrl) && !isUploading && !isGenerating
      );
    }

    if (designFlow === "plain") {
      return plainPrompt.trim().length > 0 && !isGenerating;
    }

    if (designFlow === "guided") {
      return !isGenerating;
    }

    return chatPrompt.trim().length > 0 && !isGenerating;
  }, [
    chatPrompt,
    designFlow,
    isGenerating,
    isUploading,
    mode,
    plainPrompt,
    sketchDataUrl,
    sketchUrl,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadCreditsBalance = async () => {
      try {
        const response = await fetch("/api/credits/balance", {
          cache: "no-store",
        });

        const payload = (await response.json()) as BalanceResponse;

        if (!response.ok || !Number.isFinite(payload.credits)) {
          return;
        }

        if (!cancelled) {
          setCreditsLeft(Number(payload.credits));
        }
      } catch {
        console.log("Failed to load credits balance");
      }
    };

    void loadCreditsBalance();

    const handleCreditsUpdated = () => {
      void loadCreditsBalance();
    };

    window.addEventListener("credits:updated", handleCreditsUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("credits:updated", handleCreditsUpdated);
    };
  }, []);

  useEffect(() => {
    if (!chatScrollRef.current || designFlow !== "chat") {
      return;
    }

    chatScrollRef.current.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages, isChatLoading, designFlow]);

  async function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image."));
      reader.readAsDataURL(blob);
    });
  }

  async function fetchAsDataUrl(url: string): Promise<string> {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blobToDataUrl(blob);
  }

  function toBase64Payload(dataUrl: string) {
    const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);

    if (!match) {
      throw new Error("Invalid source image payload.");
    }

    const [, mimeType, base64Data] = match;

    if (!mimeType || !base64Data) {
      throw new Error("Invalid source image payload.");
    }

    return {
      mimeType,
      base64Data,
    };
  }

  async function puterTextToText(promptText: string) {
    const { default: puter } = await import("@heyputer/puter.js");

    if (!puter.auth.isSignedIn()) {
      await puter.auth.signIn();
    }

    const response = await puter.ai.chat(promptText, {
      model: "gemini-2.5-flash",
    });

    const text = extractPuterChatText(response);

    if (!text) {
      throw new Error("Text generation returned an empty response.");
    }

    return text;
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
        throw new Error(readErrorMessage(payload, "Failed to upload sketch."));
      }

      const uploaded = payload as UploadedSketchResponse;
      setSketchUrl(uploaded.fileUrl);
      setSketchName(uploaded.fileName);
      setMessage("Sketch uploaded. Generate when ready.");
      toast.success("Sketch uploaded successfully.");
    } catch (uploadError) {
      const uploadMessage =
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload sketch.";
      setError(uploadMessage);
      toast.error(uploadMessage);
    } finally {
      setIsUploading(false);
    }
  }

  async function correctPromptGrammar() {
    if (!plainPrompt.trim()) {
      return;
    }

    setIsCorrectingPrompt(true);
    setError(null);

    try {
      const correctedPrompt = await puterTextToText(
        [
          "You are a concise grammar correction assistant for jewelry design prompts.",
          "Return only one corrected prompt sentence, preserving meaning and style intent.",
          "Do not add markdown or commentary.",
          `Input: ${plainPrompt}`,
        ].join("\n"),
      );

      setPlainPrompt(correctedPrompt);
      toast.success("Prompt corrected.");
    } catch (grammarError) {
      const grammarMessage =
        grammarError instanceof Error
          ? grammarError.message
          : "Unable to correct prompt.";
      setError(grammarMessage);
      toast.error(grammarMessage);
    } finally {
      setIsCorrectingPrompt(false);
    }
  }

  async function generateImageFromPrompt(finalPrompt: string) {
    const response = await fetch("/api/ai-design-studio/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: finalPrompt,
        size: "1024x1024",
      }),
    });

    const payload = (await response.json()) as GenerateResponse;

    if (!response.ok || !payload.outputUrl) {
      throw new Error(readErrorMessage(payload, "Failed to generate image."));
    }

    return payload.outputUrl;
  }

  async function generateUploadWithPuter(
    finalPrompt: string,
    sketchImageSource: string,
  ) {
    const { default: puter } = await import("@heyputer/puter.js");

    if (!puter.auth.isSignedIn()) {
      await puter.auth.signIn();
    }

    if (!sketchImageSource.trim()) {
      throw new Error("Upload a sketch before generating.");
    }

    const sketchDataUrl = sketchImageSource.startsWith("data:")
      ? sketchImageSource
      : await fetchAsDataUrl(sketchImageSource);

    const { mimeType, base64Data } = toBase64Payload(sketchDataUrl);

    const primaryOptions = {
      provider: "gemini",
      model: "gemini-2.5-flash-image-preview",
      prompt: finalPrompt,
      input_image: base64Data,
      input_image_mime_type: mimeType,
      ratio: { w: 1024, h: 1024 },
    };

    const fallbackOptions = {
      provider: "gemini",
      model: "gemini-2.5-flash-image-preview",
      prompt: finalPrompt,
      image_base64: sketchDataUrl,
      ratio: { w: 1024, h: 1024 },
    };

    let puterResult:
      | string
      | Blob
      | PuterLikeResult
      | PuterLikeResult[]
      | null
      | undefined;

    try {
      puterResult = (await puter.ai.txt2img(primaryOptions)) as
        | string
        | Blob
        | PuterLikeResult
        | PuterLikeResult[]
        | null
        | undefined;
    } catch {
      puterResult = (await puter.ai.txt2img(fallbackOptions)) as
        | string
        | Blob
        | PuterLikeResult
        | PuterLikeResult[]
        | null
        | undefined;
    }

    if (typeof puterResult === "string") {
      return puterResult;
    }

    if (puterResult instanceof Blob) {
      return blobToDataUrl(puterResult);
    }

    if (Array.isArray(puterResult) && puterResult.length > 0) {
      const first = puterResult[0];
      if (typeof first?.url === "string") return first.url;
      if (typeof first?.src === "string") return first.src;
      if (typeof first?.image === "string") return first.image;
      if (typeof first?.outputUrl === "string") return first.outputUrl;
      if (typeof first?.data?.url === "string") return first.data.url;
      if (typeof first?.data?.image === "string") return first.data.image;
    }

    if (
      puterResult &&
      typeof puterResult === "object" &&
      !Array.isArray(puterResult)
    ) {
      const singleResult = puterResult as PuterLikeResult;

      if (typeof singleResult.url === "string") return singleResult.url;
      if (typeof singleResult.src === "string") return singleResult.src;
      if (typeof singleResult.image === "string") return singleResult.image;
      if (typeof singleResult.outputUrl === "string")
        return singleResult.outputUrl;
      if (typeof singleResult.data?.url === "string")
        return singleResult.data.url;
      if (typeof singleResult.data?.image === "string")
        return singleResult.data.image;
    }

    throw new Error("Puter did not return a usable image output.");
  }

  async function consumeOneCredit() {
    const response = await fetch("/api/credits/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const payload = (await response.json()) as ConsumeCreditsResponse;

    if (!response.ok) {
      throw new Error(readErrorMessage(payload, "Unable to consume credit."));
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("credits:updated"));
    }

    const nextCredits = Number(payload.credits ?? 0);
    setCreditsLeft(nextCredits);

    return nextCredits;
  }

  function buildGuidedPrompt() {
    return [
      `Create a premium ${guidedType}.`,
      `Metal tone: ${guidedMetalTone}.`,
      `Stone color: ${guidedStoneColor}.`,
      `Style: ${guidedStyle}.`,
      "Render polished gold, realistic gemstone lighting, luxury off-white studio background, no text watermark or props.",
    ].join(" ");
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setMessage(null);
    setSavedToCart(false);

    try {
      let finalPrompt = "";
      let intentPrompt = "";

      if (mode === "upload") {
        if (!sketchDataUrl && !sketchUrl) {
          throw new Error("Upload a sketch before generating.");
        }

        intentPrompt = prompt.trim();

        const uploadPrompt = buildBasePrompt({
          mode,
          prompt,
        });

        finalPrompt = [
          uploadPrompt,
          `Reference sketch filename: ${sketchName ?? "uploaded sketch"}.`,
          sketchUrl ? `Reference sketch URL: ${sketchUrl}.` : "",
        ]
          .filter(Boolean)
          .join(" ");
      } else if (designFlow === "plain") {
        intentPrompt = plainPrompt.trim();

        finalPrompt = buildBasePrompt({
          mode: "design",
          prompt: plainPrompt,
        });
      } else if (designFlow === "guided") {
        intentPrompt = buildGuidedPrompt();
        finalPrompt = buildGuidedPrompt();
      } else {
        if (!chatPrompt.trim()) {
          throw new Error("Complete the chat to build your final prompt.");
        }

        intentPrompt = chatPrompt.trim();

        finalPrompt = buildBasePrompt({
          mode: "design",
          prompt: chatPrompt,
        });
      }

      if (intentPrompt && !isJewelryIntent(intentPrompt)) {
        throw new Error(
          "Only jewelry and ornament designs are allowed. Please provide a jewelry-focused prompt.",
        );
      }

      await consumeOneCredit();

      const generatedImage =
        mode === "upload"
          ? await generateUploadWithPuter(
              finalPrompt,
              sketchDataUrl ?? sketchUrl ?? "",
            )
          : await generateImageFromPrompt(finalPrompt);

      setOutputUrl(generatedImage);
      setMessage("Design visual ready. Save to cart to continue.");
      toast.success("Design generated.");
    } catch (generationError) {
      const generationMessage =
        generationError instanceof Error
          ? generationError.message
          : "Failed to generate design.";
      setError(generationMessage);
      toast.error(generationMessage);
    } finally {
      setIsGenerating(false);
    }
  }

  async function speakAssistant(text: string) {
    try {
      const response = await fetch("/api/ai-design-studio/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          languageCode: languageToCode(chatLanguage),
        }),
      });

      const payload = (await response.json()) as TtsResponse;

      if (!response.ok || !payload.audioContent) {
        throw new Error(
          readErrorMessage(payload, "Unable to generate speech."),
        );
      }

      const audio = new Audio(
        `data:${payload.mimeType ?? "audio/mpeg"};base64,${payload.audioContent}`,
      );
      await audio.play();
    } catch {
      // non-blocking for chat flow
    }
  }

  async function sendChatMessage() {
    if (!chatInput.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput.trim(),
    };

    const nextMessages = [...chatMessages, userMessage];
    setChatMessages(nextMessages);
    setChatInput("");
    setIsChatLoading(true);
    setError(null);

    try {
      const compactConversation = nextMessages
        .slice(-12)
        .map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`)
        .join("\n");

      const modelText = await puterTextToText(
        [
          "You are GoldCraft chat assistant for jewelry design.",
          `Reply in ${chatLanguage}.`,
          "Collect ornament details step by step: ornament type, style, metal tone, stone color, and occasion.",
          "When enough details exist, synthesize a final concise image prompt suitable for AI image generation.",
          "Return ONLY strict JSON with keys: reply (string), promptReady (boolean), prompt (string).",
          "If not enough details, promptReady=false and prompt should be empty string.",
          "Conversation:",
          compactConversation || "USER: I want to design a jewelry ornament.",
        ].join("\n"),
      );

      const payload = parsePuterChatJson(modelText);

      if (!payload || !payload.reply) {
        throw new Error("Unable to continue chat.");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: payload.reply,
      };

      setChatMessages((current) => [...current, assistantMessage]);

      if (payload.promptReady && payload.prompt) {
        setChatPrompt(payload.prompt);
        toast.success("Prompt prepared from chat.");
      }

      if (isVoiceMode) {
        void speakAssistant(payload.reply);
      }
    } catch (chatError) {
      const chatMessage =
        chatError instanceof Error
          ? chatError.message
          : "Unable to continue chat.";
      setError(chatMessage);
      toast.error(chatMessage);
    } finally {
      setIsChatLoading(false);
    }
  }

  function toggleVoiceInput() {
    const speechWindow = window as BrowserWindowWithSpeech;
    const SpeechRecognitionCtor =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    if (!isListening) {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = languageToCode(chatLanguage);

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        setChatInput((current) =>
          current ? `${current} ${transcript}`.trim() : transcript,
        );
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      return;
    }

    speechRecognitionRef.current?.stop();
    setIsListening(false);
  }

  async function handleSaveToCart() {
    if (!outputUrl) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const saveMode = mode === "upload" ? "upload" : "custom";
      const savePrompt =
        mode === "upload"
          ? prompt
          : designFlow === "plain"
            ? plainPrompt
            : designFlow === "guided"
              ? buildGuidedPrompt()
              : chatPrompt;

      const response = await fetch("/api/ai-design-studio/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: saveMode,
          prompt: savePrompt,
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

      if (
        payload &&
        typeof payload === "object" &&
        "outputUrl" in payload &&
        typeof payload.outputUrl === "string"
      ) {
        setOutputUrl(payload.outputUrl);
      }

      setSavedToCart(true);
      setMessage("Saved to cart as custom design.");
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
            {mode === "upload" ? "Upload" : "Design It Your Way"}
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-600">
            {mode === "upload"
              ? "Upload a sketch and generate a polished jewelry concept."
              : "Choose plain prompt, guided flow, or AI chat with voice to craft your final design prompt."}
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
            <Tabs
              value={designFlow}
              onValueChange={(value) =>
                setDesignFlow(value as "plain" | "guided" | "chat")
              }
            >
              <TabsList className="w-full justify-start rounded-full bg-amber-50 p-1">
                <TabsTrigger value="plain" className="rounded-full">
                  Plain Prompt
                </TabsTrigger>
                <TabsTrigger value="guided" className="rounded-full">
                  Guided Flow
                </TabsTrigger>
                <TabsTrigger value="chat" className="rounded-full">
                  Chat + Voice
                </TabsTrigger>
              </TabsList>

              <TabsContent value="plain" className="mt-4 space-y-3">
                <Textarea
                  value={plainPrompt}
                  onChange={(event) => setPlainPrompt(event.target.value)}
                  placeholder="Elegant 22k gold ring with floral shank and oval emerald center stone."
                  className="min-h-36 rounded-[1.2rem] border-slate-200 bg-white text-sm shadow-none focus-visible:ring-amber-200"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void correctPromptGrammar()}
                    disabled={isCorrectingPrompt || !plainPrompt.trim()}
                    className="rounded-full border-amber-200"
                  >
                    {isCorrectingPrompt ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Correcting
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Correct Grammar
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent
                value="guided"
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                <label className="space-y-1 text-sm text-slate-700">
                  Ornament Type
                  <select
                    value={guidedType}
                    onChange={(event) => setGuidedType(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option>ring</option>
                    <option>necklace</option>
                    <option>pendant</option>
                    <option>waist chain</option>
                    <option>bracelet</option>
                    <option>ear ring</option>
                    <option>nose ring</option>
                    <option>anklet</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm text-slate-700">
                  Stone Color
                  <select
                    value={guidedStoneColor}
                    onChange={(event) =>
                      setGuidedStoneColor(event.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option>emerald green</option>
                    <option>ruby red</option>
                    <option>sapphire blue</option>
                    <option>diamond white</option>
                    <option>champagne</option>
                    <option>multi-color</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm text-slate-700">
                  Metal Tone
                  <select
                    value={guidedMetalTone}
                    onChange={(event) => setGuidedMetalTone(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option>yellow gold</option>
                    <option>rose gold</option>
                    <option>white gold</option>
                    <option>dual tone gold</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm text-slate-700">
                  Style
                  <select
                    value={guidedStyle}
                    onChange={(event) => setGuidedStyle(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option>minimal luxury</option>
                    <option>traditional bridal</option>
                    <option>temple style</option>
                    <option>modern statement</option>
                    <option>vintage filigree</option>
                  </select>
                </label>
              </TabsContent>

              <TabsContent value="chat" className="mt-4 space-y-3">
                <div className="rounded-[1.2rem] border border-slate-200 bg-white p-3 sm:p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Chat Assistant
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                        <Languages className="h-3.5 w-3.5" />
                        <select
                          value={chatLanguage}
                          onChange={(event) => setChatLanguage(event.target.value)}
                          aria-label="Chat language"
                          className="bg-transparent text-xs outline-none"
                        >
                          <option>English</option>
                          <option>Hindi</option>
                          <option>Telugu</option>
                          <option>Tamil</option>
                          <option>Kannada</option>
                          <option>Malayalam</option>
                        </select>
                      </label>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsVoiceMode((current) => !current)}
                        className="rounded-full border-amber-200"
                      >
                        {isVoiceMode ? (
                          <Mic className="h-4 w-4" />
                        ) : (
                          <MicOff className="h-4 w-4" />
                        )}
                        {isVoiceMode ? "Voice On" : "Voice Off"}
                      </Button>
                    </div>
                  </div>

                  <div
                    ref={chatScrollRef}
                    className="max-h-64 space-y-2 overflow-y-auto scroll-smooth rounded-3xl border border-slate-200 bg-slate-50/60 p-3"
                  >
                    {chatMessages.map((entry, index) => {
                      const isUser = entry.role === "user";

                      return (
                        <div
                          key={`${entry.role}-${index}`}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                              isUser
                                ? "bg-slate-100 text-slate-800"
                                : "bg-amber-50 text-amber-900"
                            }`}
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-70">
                              {isUser ? "You" : "AI"}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap leading-5">
                              {entry.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {isChatLoading ? (
                      <div className="flex justify-start">
                        <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800 shadow-sm">
                          AI is thinking...
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Describe your ornament idea..."
                      className="min-h-20 rounded-3xl border-slate-200 bg-white text-sm shadow-none"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={toggleVoiceInput}
                        className="rounded-full border-amber-200"
                      >
                        {isListening ? (
                          <MicOff className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                        {isListening ? "Stop Listening" : "Voice Input"}
                      </Button>

                      <Button
                        type="button"
                        onClick={() => void sendChatMessage()}
                        disabled={isChatLoading || !chatInput.trim()}
                        className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900">
                    Final prompt from chat
                  </p>
                  <p className="mt-1 whitespace-pre-wrap leading-5">
                    {chatPrompt ||
                      "Keep chatting until assistant prepares a final prompt."}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
              Credits Left: {creditsLeft ?? "--"}
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
                "Generate Visual"
              ) : (
                "Generate Custom Visual"
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
                Add to Cart
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}