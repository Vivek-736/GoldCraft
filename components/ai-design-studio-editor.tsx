"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ImageIcon,
  Languages,
  Loader2,
  Mic,
  MicOff,
  ShoppingBag,
  Sparkles,
  Upload,
  Bot,
  User,
  ArrowRight
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

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
  onend: (() => void) | null;
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

const STUDIO_LANGUAGES = [
  { label: "English", value: "en-US", voice: "en-US-Standard-C" },
  { label: "Hindi", value: "hi-IN", voice: "hi-IN-Standard-A" },
  { label: "Telugu", value: "te-IN", voice: "te-IN-Standard-A" },
  { label: "Tamil", value: "ta-IN", voice: "ta-IN-Standard-A" },
];

function languageToCode(language: string) {
  const normalized = language.toLowerCase();

  const found = STUDIO_LANGUAGES.find(l => l.label.toLowerCase() === normalized);
  if (found) return found.value;

  return "en-US";
}

function languageToVoice(language: string) {
  const normalized = language.toLowerCase();
  const found = STUDIO_LANGUAGES.find(l => l.label.toLowerCase() === normalized);
  if (found) return found.voice;

  return "en-US-Standard-C";
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

  const [guidedStep, setGuidedStep] = useState(1);
  const [guidedAnswers, setGuidedAnswers] = useState<{
    item?: string;
    target?: string;
    style?: string;
    gemstones?: string;
    customDetails?: string;
  }>({});
  const [guidedCustomInput, setGuidedCustomInput] = useState("");
  const guidedScrollRef = useRef<HTMLDivElement | null>(null);

  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((current) => (current + 1) % 4);
    }, 1500);
    return () => clearInterval(interval);
  }, [isGenerating]);

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
      return guidedStep > 5 && !isGenerating;
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
    guidedStep,
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

  useEffect(() => {
    if (!guidedScrollRef.current || designFlow !== "guided") {
      return;
    }

    guidedScrollRef.current.scrollTo({
      top: guidedScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [guidedStep, designFlow]);

  useEffect(() => {
    if (mode !== "design" || designFlow !== "chat") {
      return;
    }

    const chatInputElement = document.querySelector<HTMLTextAreaElement>(
      'textarea[data-ai-design-chat-input="true"]',
    );

    if (!chatInputElement) {
      return;
    }

    const handleChatEnterToSend = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.isComposing || event.shiftKey) {
        return;
      }

      event.preventDefault();

      if (isChatLoading || !chatInput.trim()) {
        return;
      }

      void sendChatMessage();
    };

    chatInputElement.addEventListener("keydown", handleChatEnterToSend);

    return () => {
      chatInputElement.removeEventListener("keydown", handleChatEnterToSend);
    };
  }, [mode, designFlow, isChatLoading, chatInput]);

  useEffect(() => {
    if (mode !== "upload") {
      return;
    }

    const uploadPromptElement = document.querySelector<HTMLTextAreaElement>(
      'textarea[data-ai-upload-prompt="true"]',
    );

    if (!uploadPromptElement) {
      return;
    }

    const handleUploadEnterToGenerate = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.isComposing || event.shiftKey) {
        return;
      }

      event.preventDefault();

      if (!canGenerate) {
        return;
      }

      void handleGenerate();
    };

    uploadPromptElement.addEventListener("keydown", handleUploadEnterToGenerate);

    return () => {
      uploadPromptElement.removeEventListener("keydown", handleUploadEnterToGenerate);
    };
  }, [mode, canGenerate]);

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
      `Create a premium ${guidedAnswers.target ? guidedAnswers.target.toLowerCase() + " " : ""}${guidedAnswers.item ? guidedAnswers.item.toLowerCase() : "jewelry piece"}.`,
      guidedAnswers.style ? `Style Motif: ${guidedAnswers.style}.` : "",
      guidedAnswers.gemstones && guidedAnswers.gemstones !== "No Stones" ? `Gemstones: ${guidedAnswers.gemstones}.` : "No gemstones, pure solid metal.",
      guidedAnswers.customDetails && guidedAnswers.customDetails.toLowerCase() !== "none" ? `Custom Details: ${guidedAnswers.customDetails}.` : "",
      "Render polished gold, realistic lighting, luxury off-white studio background, no text watermark or props.",
    ].filter(Boolean).join(" ");
  }

  const guidedMessages = useMemo(() => {
    const messages: Array<{ role: "bot" | "user"; text: string; options?: string[]; step?: number; allowInput?: boolean }> = [];

    messages.push({ role: "bot", text: "I'll help you design your perfect piece! Step 1/5: What item would you like to create?", options: ["Ring", "Necklace", "Earrings", "Bracelet", "Pendant"], step: 1 });
    if (guidedStep > 1) {
      messages.push({ role: "user", text: guidedAnswers.item ?? "" });
      messages.push({ role: "bot", text: `Great choice! Who is this ${guidedAnswers.item?.toLowerCase()} for?`, options: ["Ladies", "Mens", "Unisex", "Kids"], step: 2 });
    }
    if (guidedStep > 2) {
      messages.push({ role: "user", text: guidedAnswers.target ?? "" });
      messages.push({ role: "bot", text: "Do you have a specific style or motif in mind? Select or type your own.", options: ["Floral", "Geometric", "Minimalist", "Vintage", "Butterfly", "Letter/Initial"], step: 3, allowInput: true });
    }
    if (guidedStep > 3) {
      messages.push({ role: "user", text: guidedAnswers.style ?? "" });
      messages.push({ role: "bot", text: "Would you like to add any gemstones?", options: ["Diamond", "Ruby", "Emerald", "Sapphire", "No Stones", "Multi-colored"], step: 4 });
    }
    if (guidedStep > 4) {
      messages.push({ role: "user", text: guidedAnswers.gemstones ?? "" });
      messages.push({ role: "bot", text: "Almost done! Any final custom details? (e.g., 'Thin band', 'Engraving', 'Matte finish') or just say 'None'.", step: 5, allowInput: true });
    }
    if (guidedStep > 5) {
      messages.push({ role: "user", text: guidedAnswers.customDetails ?? "" });
      messages.push({ role: "bot", text: `Perfect! Your design prompt is ready:\n\n"${buildGuidedPrompt()}"\n\nClick 'Generate Custom Visual' to see your creation.`, step: 6 });
    }

    return messages;
  }, [guidedStep, guidedAnswers]);

  const handleGuidedOptionSelect = (option: string) => {
    switch (guidedStep) {
      case 1:
        setGuidedAnswers((prev) => ({ ...prev, item: option }));
        break;
      case 2:
        setGuidedAnswers((prev) => ({ ...prev, target: option }));
        break;
      case 3:
        setGuidedAnswers((prev) => ({ ...prev, style: option }));
        break;
      case 4:
        setGuidedAnswers((prev) => ({ ...prev, gemstones: option }));
        break;
      case 5:
        setGuidedAnswers((prev) => ({ ...prev, customDetails: option }));
        break;
    }
    setGuidedStep((prev) => prev + 1);
    setGuidedCustomInput("");
  };

  const currentGuidedMessage = guidedMessages[guidedMessages.length - 1];

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
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          languageCode: languageToCode(chatLanguage),
          voiceName: languageToVoice(chatLanguage)
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
        setChatInput((current) => {
          const updatedValue = current ? `${current} ${transcript}`.trim() : transcript;
          return updatedValue;
        });

        // If in voice mode, auto-submit when the transcription is received
        // Note: we can't easily wait for more results without keeping recognition alive
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // After voice ends, if we have content and are in voice mode, auto-click submit
        // However, we rely on the latest state. To avoid race conditions, we can use a DOM-level trigger
        // or ensure our message is processed.
        const chatInputElement = document.querySelector<HTMLInputElement>(
          'input[data-ai-design-chat-input="true"]',
        );
        if (isVoiceMode && chatInputElement && chatInputElement.value.trim()) {
           void sendChatMessage();
        }
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
    <div className="grid h-full min-h-0 w-full flex-1 gap-6 lg:grid-cols-[48%_52%] pb-4 relative z-10 overflow-hidden">
      <Card className="flex h-full min-h-0 min-w-0 flex-col rounded-[2rem] border border-[#E6C27A]/40 bg-white/40 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardHeader className="px-6 py-5 md:px-8 md:py-6 border-b border-[#E6C27A]/10">
          <CardTitle className="font-serif text-3xl font-medium tracking-wide text-[#0F172A]">
            {mode === "upload" ? "Upload Sketch" : "Design Studio"}
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-600 max-w-sm">
            {mode === "upload"
              ? "Upload a rough sketch and we'll craft a polished jewelry concept."
              : "Choose a mode to craft your unique GoldCraft specification."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 pt-5 md:px-8 md:pb-8">
          {mode === "upload" ? (
            <div className="flex h-full flex-col gap-4">
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

              <div
                className={`group flex min-h-[220px] flex-1 w-full cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-[#E6C27A]/30 bg-white/50 px-6 py-8 text-center transition-all duration-300 hover:border-[#D4A95A] hover:bg-[#D4A95A]/5 hover:shadow-[0_0_20px_rgba(212,169,90,0.15)] ${isUploading ? "pointer-events-none opacity-80" : ""
                  }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {sketchDataUrl || sketchUrl ? (
                  <div className="relative flex h-full w-full flex-col items-center justify-center">
                    <img
                      src={(sketchDataUrl || sketchUrl) ?? ""}
                      alt="Upload preview"
                      className="max-h-[160px] w-auto rounded-xl object-contain shadow-sm ring-1 ring-black/5"
                    />
                    <div className="absolute -bottom-4 flex gap-2">
                      <Button size="sm" variant="secondary" className="h-8 rounded-full bg-white text-xs font-semibold text-[#0F172A] shadow-sm hover:bg-slate-50">
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSketchUrl(null);
                          setSketchDataUrl(null);
                          setPrompt("");
                        }}
                        className="h-8 rounded-full bg-white text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.2rem] bg-white text-[#D4A95A] shadow-sm transition-transform duration-300 group-hover:scale-110">
                      {isUploading ? (
                        <Loader2 className="h-7 w-7 animate-spin" />
                      ) : (
                        <Upload className="h-7 w-7" />
                      )}
                    </div>
                    <h2 className="mt-5 font-serif text-lg font-medium text-[#0F172A]">
                      Drop sketch here
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Click or drag and drop to upload
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-[1.4rem] border border-[#E6C27A]/10 bg-white/60 p-4 shrink-0">
                <p className="text-sm font-medium text-[#0F172A] mb-2 font-serif">
                  Additional Details
                </p>
                <Textarea
                  data-ai-upload-prompt="true"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Specify material, stone colors, or chain type..."
                  className="min-h-6 rounded-2xl border-slate-200 bg-white/70 text-sm shadow-inner focus-visible:ring-[#D4A95A] resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0 gap-4">
              <Tabs
                value={designFlow}
                onValueChange={(value) =>
                  setDesignFlow(value as "plain" | "guided" | "chat")
                }
                className="flex flex-col h-full min-h-0"
              >
                <TabsList className="w-full shrink-0 justify-start rounded-full bg-white/60 border border-[#E6C27A]/20 p-1 shadow-sm">
                  <TabsTrigger value="plain" className="rounded-full data-[state=active]:bg-linear-to-r data-[state=active]:from-[#E6C27A] data-[state=active]:to-[#D4A95A] data-[state=active]:text-white">
                    Plain Prompt
                  </TabsTrigger>
                  <TabsTrigger value="guided" className="rounded-full data-[state=active]:bg-linear-to-r data-[state=active]:from-[#E6C27A] data-[state=active]:to-[#D4A95A] data-[state=active]:text-white">
                    Guided Flow
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="rounded-full data-[state=active]:bg-linear-to-r data-[state=active]:from-[#E6C27A] data-[state=active]:to-[#D4A95A] data-[state=active]:text-white">
                    AI Concierge
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="plain" className="mt-0 pt-4 flex-1 flex flex-col min-h-0 gap-3">
                  <div className="relative flex-1 min-h-0">
                    <Textarea
                      value={plainPrompt}
                      onChange={(event) => setPlainPrompt(event.target.value)}
                      placeholder="e.g., Elegant 22k gold ring with floral shank and an oval emerald center stone..."
                      className="absolute inset-0 h-full w-full resize-none rounded-[1.2rem] border-slate-200 bg-white/70 text-sm shadow-inner focus-visible:ring-[#D4A95A] p-4 font-medium leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      <button onClick={() => setPlainPrompt("Minimalist ring in 18k rose gold")} className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-[#D4A95A] hover:text-[#D4A95A]">
                        Minimal Ring
                      </button>
                      <button onClick={() => setPlainPrompt("Traditional temple antique necklace")} className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-[#D4A95A] hover:text-[#D4A95A]">
                        Temple Jewelry
                      </button>
                      <button onClick={() => setPlainPrompt("Modern diamond fusion bracelet")} className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-[#D4A95A] hover:text-[#D4A95A]">
                        Diamond Fusion
                      </button>
                    </div>

                    <Button
                      type="button"
                      onClick={() => void correctPromptGrammar()}
                      disabled={isCorrectingPrompt || !plainPrompt.trim()}
                      className="rounded-full bg-slate-900 border-none text-white overflow-hidden transition-all hover:bg-slate-800"
                    >
                      {isCorrectingPrompt ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-[#D4A95A] mr-2" />
                      )}
                      Enhance ✨
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="guided" className="mt-0 pt-4 flex flex-col flex-1 min-h-0">
                  <div className="flex w-full items-center justify-between mb-2 px-2 relative shrink-0">
                    <div className="absolute left-6 right-6 top-1/2 h-[2px] -translate-y-1/2 bg-slate-100 z-0"></div>
                    <div className="absolute left-6 right-6 top-1/2 h-[2px] -translate-y-1/2 bg-linear-to-r from-[#E6C27A] to-[#D4A95A] z-0 transition-all duration-500 ease-in-out" style={{ width: `${Math.min(((Math.min(guidedStep, 6) - 1) / 5) * 100, 100)}%` }}></div>
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <div key={step} className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-500 outline-4 outline-white ${guidedStep >= step ? "bg-linear-to-b from-[#E6C27A] to-[#D4A95A] text-white shadow-[0_0_10px_rgba(212,169,90,0.5)] scale-110" : "bg-white border-2 border-slate-200 text-slate-400"}`}>
                        {step === 6 ? <Sparkles className="h-3.5 w-3.5" /> : step}
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-2 flex flex-col flex-1 min-h-0 rounded-[1.2rem] border border-[#E6C27A]/20 bg-white/60 p-2 sm:p-3 shadow-inner">
                    <div
                      ref={guidedScrollRef}
                      className="flex-1 min-h-0 space-y-4 overflow-y-auto scroll-smooth p-2 pr-3 no-scrollbar"
                    >
                      {guidedMessages.map((msg, index) => {
                        const isBot = msg.role === "bot";
                        return (
                          <div key={index} className={`flex gap-3 w-full transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-4 ${isBot ? "justify-start" : "justify-end"}`}>
                            {isBot && (
                              <div className="shrink-0 h-9 w-9 rounded-full bg-linear-to-br from-[#F8F6F2] to-[#E6C27A]/20 text-[#D4A95A] flex items-center justify-center mt-1 shadow-sm ring-1 ring-[#E6C27A]/30">
                                <Bot className="h-5 w-5" />
                              </div>
                            )}
                            <div className={`flex flex-col gap-3 ${isBot ? "items-start w-full" : "items-end max-w-[75%]"}`}>
                              <div
                                className={`px-4 py-3 text-[14px] leading-relaxed shadow-sm ${isBot
                                  ? "bg-white border border-[#E6C27A]/10 text-slate-800 rounded-2xl rounded-tl-sm max-w-[90%]"
                                  : "bg-linear-to-r from-[#E6C27A] to-[#D4A95A] text-white rounded-2xl rounded-tr-sm"
                                  }`}
                              >
                                {msg.text}
                              </div>

                              {isBot && msg.step === guidedStep && (
                                <div className="flex flex-wrap gap-2 w-full pt-1 animate-in fade-in slide-in-from-left-2 duration-500">
                                  {msg.options?.map((opt) => (
                                    <button
                                      key={opt}
                                      onClick={() => handleGuidedOptionSelect(opt)}
                                      className="px-4 py-2 bg-white hover:bg-[#D4A95A] text-slate-700 hover:text-white text-sm font-medium rounded-full transition-all shadow-sm ring-1 ring-slate-200 hover:ring-[#D4A95A] active:scale-95"
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {isBot && msg.step === guidedStep && msg.allowInput && (
                                <div className="flex gap-2 w-full max-w-sm mt-2 animate-in fade-in slide-in-from-left-2 duration-500">
                                  <Input
                                    value={guidedCustomInput}
                                    onChange={(e) => setGuidedCustomInput(e.target.value)}
                                    placeholder="Type your own..."
                                    className="h-11 rounded-full bg-white border-slate-200 text-sm shadow-sm focus-visible:border-[#D4A95A] focus-visible:ring-[#D4A95A]"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && guidedCustomInput.trim()) {
                                        handleGuidedOptionSelect(guidedCustomInput.trim());
                                      }
                                    }}
                                  />
                                  <Button
                                    onClick={() => handleGuidedOptionSelect(guidedCustomInput.trim())}
                                    disabled={!guidedCustomInput.trim()}
                                    className="h-11 px-4 rounded-full bg-linear-to-r from-[#E6C27A] to-[#D4A95A] text-white hover:opacity-90 shadow-sm border-none"
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            {!isBot && (
                              <div className="shrink-0 h-9 w-9 rounded-full bg-white text-slate-400 flex items-center justify-center mt-1 shadow-sm ring-1 ring-slate-200">
                                <User className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-0 pt-4 flex flex-col flex-1 min-h-0">
                  <div className="relative flex flex-col flex-1 min-h-0 rounded-[1.2rem] border border-[#E6C27A]/20 bg-white/60 p-3 sm:p-4 shadow-inner">
                    <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4A95A]">
                        AI Concierge
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-slate-100/80 rounded-full p-[2px] border border-slate-200 shadow-xs mr-1">
                          <button 
                            type="button" 
                            onClick={() => setIsVoiceMode(false)}
                            className={cn(
                              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-300",
                              !isVoiceMode ? "bg-white shadow-xs text-[#D4A95A]" : "text-slate-400 hover:text-slate-600"
                            )}
                          >
                            Chat
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setIsVoiceMode(true)}
                            className={cn(
                              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-300",
                              isVoiceMode ? "bg-white shadow-xs text-[#D4A95A]" : "text-slate-400 hover:text-slate-600"
                            )}
                          >
                            Voice
                          </button>
                        </div>

                        <label className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-[#E6C27A]">
                          <Languages className="h-3 w-3 text-[#D4A95A]" />
                          <select
                            value={chatLanguage}
                            onChange={(event) => setChatLanguage(event.target.value)}
                            aria-label="Chat language"
                            className="bg-transparent text-xs font-medium outline-none cursor-pointer"
                          >
                            {STUDIO_LANGUAGES.map(lang => (
                              <option key={lang.value}>{lang.label}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <div
                      ref={chatScrollRef}
                      className="flex-1 min-h-0 space-y-3 overflow-y-auto scroll-smooth p-2 no-scrollbar"
                    >
                      {chatMessages.map((entry, index) => {
                        const isUser = entry.role === "user";

                        return (
                          <div
                            key={`${entry.role}-${index}`}
                            className={`flex gap-3 transition-opacity duration-300 animate-in fade-in slide-in-from-bottom-2 ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            {!isUser && (
                              <div className="shrink-0 h-8 w-8 rounded-full bg-linear-to-br from-[#F8F6F2] to-[#E6C27A]/20 text-[#D4A95A] flex items-center justify-center mt-1 shadow-sm ring-1 ring-[#E6C27A]/30">
                                <Bot className="h-4 w-4" />
                              </div>
                            )}
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] shadow-sm ${isUser
                                ? "bg-linear-to-r from-[#E6C27A] to-[#D4A95A] text-white rounded-tr-sm"
                                : "bg-white border border-[#E6C27A]/10 text-slate-800 rounded-tl-sm"
                                }`}
                            >
                              <p className="mt-0.5 whitespace-pre-wrap leading-relaxed">
                                {entry.content}
                              </p>
                            </div>
                            {isUser && (
                              <div className="shrink-0 h-8 w-8 rounded-full bg-white text-slate-400 flex items-center justify-center mt-1 shadow-sm ring-1 ring-slate-200">
                                <User className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {isChatLoading ? (
                        <div className="flex justify-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                          <div className="shrink-0 h-8 w-8 rounded-full bg-linear-to-br from-[#F8F6F2] to-[#E6C27A]/20 text-[#D4A95A] flex items-center justify-center mt-1 shadow-sm ring-1 ring-[#E6C27A]/30">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="rounded-2xl rounded-tl-sm bg-white border border-[#E6C27A]/10 px-4 py-3 text-[14px] text-slate-500 shadow-sm flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 bg-[#D4A95A] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="h-1.5 w-1.5 bg-[#D4A95A] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="h-1.5 w-1.5 bg-[#D4A95A] rounded-full animate-bounce"></span>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 shrink-0 flex items-center gap-2 bg-white rounded-full p-1 border border-slate-200 shadow-sm transition-all focus-within:border-[#D4A95A] focus-within:ring-2 focus-within:ring-[#E6C27A]/20">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={toggleVoiceInput}
                        className={`h-10 w-10 shrink-0 rounded-full p-0 transition-all ${isListening ? "bg-rose-50 text-rose-500 animate-pulse relative" : "text-slate-400 hover:text-[#D4A95A] hover:bg-[#F8F6F2]"}`}
                      >
                        {isListening && <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-20"></div>}
                        {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                      </Button>
                      <input
                        data-ai-design-chat-input="true"
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && chatInput.trim()) {
                            void sendChatMessage();
                          }
                        }}
                        placeholder={isVoiceMode ? "Tap microphone and speak..." : "Ask the AI Concierge..."}
                        className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate-400"
                      />
                      <Button
                        type="button"
                        onClick={() => void sendChatMessage()}
                        disabled={isChatLoading || !chatInput.trim()}
                        className="h-10 w-10 shrink-0 rounded-full p-0 bg-linear-to-r from-[#E6C27A] to-[#D4A95A] text-white transition-opacity hover:opacity-90 border-none shadow-sm disabled:opacity-50"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
              Credits Left: {creditsLeft ?? "--"}
            </div>

            <Button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!canGenerate}
              className="rounded-full bg-amber-600 px-6 text-white shadow-sm transition-colors hover:bg-amber-700"
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

      <Card className="relative flex h-full min-h-0 min-w-0 flex-col rounded-[2rem] border-none bg-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-2xl ring-1 ring-white">
        <CardHeader className="px-6 py-5 md:px-8 md:py-6 shrink-0">
          <CardTitle className="font-serif text-3xl font-medium tracking-wide text-[#0F172A]">Preview Studio</CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-600">
            {isGenerating
              ? "Synthesizing AI render..."
              : outputUrl
                ? "High-fidelity jewelry render"
                : mode === "upload" && (sketchDataUrl || sketchUrl)
                  ? "Analyzing uploaded sketch"
                  : "Your design concept will appear here"}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative flex min-h-0 flex-1 flex-col px-6 pb-6 md:px-8 md:pb-8">
          <div className="relative flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-[1.8rem] bg-linear-to-b from-[#F8F6F2] to-white/40 shadow-inner ring-1 ring-[#E6C27A]/20">
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[1.8rem]">
              <div className="absolute top-1/4 left-1/4 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E6C27A] opacity-[0.03] blur-3xl" />
              <div className="absolute bottom-1/3 right-1/4 h-48 w-48 translate-x-1/3 translate-y-1/3 rounded-full bg-[#D4A95A] opacity-[0.03] blur-3xl" />
            </div>

            {isGenerating ? (
              <div className="relative z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[3px] border-[#E6C27A]/10"></div>
                  <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#D4A95A] border-r-[#E6C27A] animate-[spin_1.5s_linear_infinite]"></div>

                  <div className="absolute inset-0 flex items-center justify-center animate-[spin_4s_linear_infinite_reverse]">
                    <Sparkles className="h-8 w-8 text-[#D4A95A] opacity-80" />
                  </div>

                  <div className="absolute inset-y-0 h-full w-[2px] bg-linear-to-b from-transparent via-[#E6C27A]/40 to-transparent animate-[spin_3s_linear_infinite]" />
                  <div className="absolute inset-x-0 w-full h-[2px] bg-linear-to-r from-transparent via-[#E6C27A]/40 to-transparent animate-[spin_3s_linear_infinite_reverse]" />
                </div>

                <h3 className="mt-8 font-serif text-xl font-medium text-[#0F172A] tracking-wide animate-pulse">
                  Crafting your design...
                </h3>
                <p className="mt-2 text-sm text-[#D4A95A] font-semibold tracking-wider uppercase h-6 transition-all duration-300">
                  {loadingStep === 0 && "Analyzing sketch..."}
                  {loadingStep === 1 && "Refining geometry..."}
                  {loadingStep === 2 && "Applying gold finish..."}
                  {loadingStep === 3 && "Adding luxury lighting..."}
                </p>
              </div>
            ) : previewUrl ? (
              <div className="relative flex h-full w-full items-center justify-center p-4 animate-in fade-in duration-1000">
                <div className="relative h-full w-full max-h-full max-w-full group perspective-1000">
                  <div className="absolute bottom-4 left-1/2 h-4 w-3/4 -translate-x-1/2 rounded-[100%] bg-black/10 blur-xl transition-all duration-500 group-hover:bg-[#E6C27A]/20" />

                  <img
                    src={previewUrl}
                    alt={outputUrl ? "Generated jewelry visual" : "Uploaded sketch preview"}
                    className="relative z-10 h-full w-full rounded-[1.2rem] object-contain transition-transform duration-700 hover:scale-[1.02]"
                  />

                  <div className="absolute inset-0 z-20 pointer-events-none rounded-[1.2rem] bg-linear-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white ring-1 ring-[#E6C27A]/20 text-[#D4A95A] shadow-[0_8px_30px_rgba(212,169,90,0.12)]">
                  {mode === "upload" ? (
                    <ImageIcon className="h-8 w-8" />
                  ) : (
                    <Sparkles className="h-8 w-8" />
                  )}
                </div>
                <p className="mt-6 font-serif text-lg text-slate-800">
                  {mode === "upload"
                    ? "Upload a sketch to preview"
                    : "Your masterpiece awaits"}
                </p>
                <p className="mt-2 text-sm text-slate-500 max-w-[200px]">
                  Fill out the details on the left and generate a visual.
                </p>
              </div>
            )}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] md:w-[calc(100%-4rem)] z-50">
            <Button
              type="button"
              onClick={() => void handleSaveToCart()}
              disabled={!canSave || isGenerating}
              className={`h-14 w-full rounded-2xl text-base font-semibold text-white shadow-[0_8px_20px_rgba(212,169,90,0.3)] transition-all duration-500 hover:shadow-[0_12px_25px_rgba(212,169,90,0.4)] hover:-translate-y-0.5 ${!canSave || isGenerating
                ? "bg-slate-200 text-slate-400 shadow-none hover:shadow-none hover:translate-y-0"
                : "bg-linear-to-r from-[#be8f31] to-[#D4A95A]"
                }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Securing...
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Add to Collection
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}