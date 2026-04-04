"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  ExternalLink,
  LoaderCircle,
  Search,
  Sparkles,
  ZoomIn,
  Mic,
  Volume2,
  Languages,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ChatMessageView = {
  id: number;
  role: "user" | "assistant";
  content: string;
  images: string[];
  sources: Array<{ title: string; url: string; content?: string }>;
  createdAt?: string;
  animate?: boolean;
};

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (overrideValue?: string) => void;
  isSending: boolean;
  hasStartedChat: boolean;
  interactionMode: "chat" | "voice";
  setInteractionMode: (mode: "chat" | "voice") => void;
  selectedLang: typeof LANGUAGES[0];
};

type ChatMessagesProps = {
  messages: ChatMessageView[];
  isSending: boolean;
  onSelectImage: (image: string) => void;
  endRef: React.RefObject<HTMLDivElement | null>;
  selectedLang: typeof LANGUAGES[0];
};

const LANGUAGES = [
  { label: "English (US)", value: "en-US", voice: "en-US-Standard-C" },
  { label: "Hindi (India)", value: "hi-IN", voice: "hi-IN-Standard-A" },
  { label: "Telugu (India)", value: "te-IN", voice: "te-IN-Standard-A" },
  { label: "Tamil (India)", value: "ta-IN", voice: "ta-IN-Standard-A" },
  { label: "Marathi (India)", value: "mr-IN", voice: "mr-IN-Standard-A" },
];

function isHtmlContent(text: string) {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeBasicEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripFormattedContentForTyping(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return "";
  }

  if (isHtmlContent(normalized)) {
    return decodeBasicEntities(
      normalized
        .replace(/<li\b[^>]*>/gi, "- ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|section|li|h3|h4|ul|ol)>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
    );
  }

  return decodeBasicEntities(
    normalized
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/\*\*/g, "")
      .replace(/__(.*?)__/g, "$1")
      .replace(/`/g, "")
      .replace(/^\s*[-*]\s+/gm, "- ")
      .replace(/^\s*\d+\.\s+/gm, "")
      .trim(),
  );
}

function cleanSourceText(text?: string) {
  if (!text) {
    return "";
  }

  return text.replace(/\s+/g, " ").trim();
}

function getSourceHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function sanitizeAssistantHtml(html: string) {
  let safe = html
    .replace(/```html/gi, "")
    .replace(/```/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(
      /<\/?(html|body|head|meta|iframe|object|embed|form|input|button|textarea|svg|math)[^>]*>/gi,
      "",
    )
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\sstyle=("[^"]*"|'[^']*')/gi, "")
    .trim();

  safe = safe.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    const hrefMatch = attrs.match(/\shref=("([^"]+)"|'([^']+)')/i);
    const href = hrefMatch ? (hrefMatch[2] ?? hrefMatch[3] ?? "") : "";
    const safeHref = /^https?:\/\//i.test(href) ? href : "";

    return safeHref
      ? `<a href="${safeHref}" target="_blank" rel="noreferrer noopener">`
      : "<a>";
  });

  safe = safe.replace(
    /<(?!\/?(section|div|p|ul|ol|li|strong|em|a|br|h3|h4)\b)[^>]+>/gi,
    "",
  );

  if (!isHtmlContent(safe)) {
    return `<section><p>${escapeHtml(decodeBasicEntities(safe))}</p></section>`;
  }

  return safe;
}

function AssistantHtmlMessage({ html }: { html: string }) {
  const safeHtml = sanitizeAssistantHtml(html);

  return (
    <div
      className="space-y-4 text-slate-800 [&_section]:rounded-[1.35rem] [&_section]:border [&_section]:border-amber-100/80 [&_section]:bg-white/80 [&_section]:px-4 [&_section]:py-3.5 [&_section]:shadow-[0_10px_30px_rgba(120,53,15,0.06)] [&_section+section]:mt-3.5 [&_h3]:mb-2 [&_h3]:text-[11px] [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-[0.24em] [&_h3]:text-amber-700 [&_h4]:mb-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-slate-900 [&_p]:text-sm [&_p]:leading-7 [&_p]:text-slate-700 md:[&_p]:text-[15px] [&_ul]:space-y-2.5 [&_ul]:pl-5 [&_ul]:text-sm [&_ul]:leading-7 [&_ul]:text-slate-700 [&_ul]:marker:text-amber-700 [&_ol]:space-y-2.5 [&_ol]:pl-5 [&_ol]:text-sm [&_ol]:leading-7 [&_ol]:text-slate-700 [&_ol]:marker:font-semibold [&_ol]:marker:text-amber-700 [&_strong]:font-semibold [&_strong]:text-slate-950 [&_em]:italic [&_a]:font-medium [&_a]:text-amber-800 [&_a]:underline-offset-4 hover:[&_a]:underline"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

function PlainAssistantMessage({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 md:text-[15px]">
      {stripFormattedContentForTyping(text)}
    </p>
  );
}

function FinalAssistantMessage({ text }: { text: string }) {
  if (isHtmlContent(text)) {
    return <AssistantHtmlMessage html={text} />;
  }

  return <PlainAssistantMessage text={text} />;
}

function getSafeHtmlSlice(html: string, visibleLength: number) {
  let htmlIndex = 0;
  let textCount = 0;
  const tagStack: string[] = [];
  const len = html.length;

  while (htmlIndex < len && textCount < visibleLength) {
    if (html[htmlIndex] === "<") {
      const isClosing = html[htmlIndex + 1] === "/";
      const endTag = html.indexOf(">", htmlIndex);
      if (endTag === -1) break;

      const tagMatch = html
        .slice(htmlIndex + (isClosing ? 2 : 1), endTag)
        .match(/^[a-z0-9]+/i);
      const tagName = tagMatch?.[0]?.toLowerCase();

      if (tagName && tagName !== "br") {
        if (isClosing) {
          if (tagStack[tagStack.length - 1] === tagName) {
            tagStack.pop();
          }
        } else {
          tagStack.push(tagName);
        }
      }
      htmlIndex = endTag + 1;
    } else if (html[htmlIndex] === "&") {
      const endEntity = html.indexOf(";", htmlIndex);
      if (endEntity !== -1 && endEntity - htmlIndex < 10) {
        htmlIndex = endEntity + 1;
      } else {
        htmlIndex++;
      }
      textCount++;
    } else {
      htmlIndex++;
      textCount++;
    }
  }

  let result = html.slice(0, htmlIndex);

  for (let i = tagStack.length - 1; i >= 0; i--) {
    result += `</${tagStack[i]}>`;
  }

  return result;
}

function AnimatedMessage({
  text,
  animate,
}: {
  text: string;
  animate?: boolean;
}) {
  const isHtml = isHtmlContent(text);
  const displayContent = isHtml ? text : stripFormattedContentForTyping(text);
  const plainTextForCount = stripFormattedContentForTyping(text);

  const [visibleLength, setVisibleLength] = useState(
    animate ? 0 : plainTextForCount.length,
  );
  const [isComplete, setIsComplete] = useState(!animate);

  useEffect(() => {
    if (!animate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibleLength(plainTextForCount.length);
      setIsComplete(true);
      return;
    }

    setVisibleLength(0);
    setIsComplete(false);

    if (!plainTextForCount.length) {
      setIsComplete(true);
      return;
    }

    const interval = window.setInterval(() => {
      setVisibleLength((current) => {
        const next = current + 1;

        if (next >= plainTextForCount.length) {
          window.clearInterval(interval);
          setIsComplete(true);
          return plainTextForCount.length;
        }

        return next;
      });
    }, 18);

    return () => window.clearInterval(interval);
  }, [animate, plainTextForCount]);

  if (!animate || isComplete) {
    return <FinalAssistantMessage text={text} />;
  }

  if (isHtml) {
    const slicedHtml = getSafeHtmlSlice(text, visibleLength);
    return (
      <div className="relative">
        <AssistantHtmlMessage html={slicedHtml} />
        <span className="ml-1 inline-block h-5 w-[2px] animate-pulse rounded-full bg-amber-700 align-[-2px]" />
      </div>
    );
  }

  return (
    <p
      className="whitespace-pre-wrap text-sm leading-7 text-slate-800 md:text-[15px]"
      aria-live="polite"
    >
      {displayContent.slice(0, visibleLength)}
      <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse rounded-full bg-amber-700 align-[-2px]" />
    </p>
  );
}

function ChatInput({
  value,
  onChange,
  onSubmit,
  isSending,
  hasStartedChat,
  interactionMode,
  setInteractionMode,
  selectedLang,
}: ChatInputProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = selectedLang.value;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      onChange(transcript);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      if (interactionMode === "voice" && value.trim()) {
        onSubmit(value.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
      className={cn(
        "w-full rounded-[1.9rem] border border-amber-100 bg-white/96 px-4 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:px-5 md:py-3.5 flex flex-col gap-2",
        hasStartedChat ? "max-w-5xl" : "max-w-3xl",
      )}
    >
      <div className="flex items-end gap-3">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={interactionMode === "voice" ? "Tap the microphone and speak..." : "Ask GoldCraft AI about gold, markets, design inspiration, news..."}
          className="min-h-[56px] max-h-32 flex-1 resize-none border-0 bg-transparent px-0 py-0 text-sm leading-6 shadow-none focus-visible:ring-0"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
        />
        {interactionMode === "voice" && (
          <Button
            type="button"
            onClick={toggleListening}
            variant="outline"
            className={cn(
              "h-11 shrink-0 rounded-full px-4 border shadow-sm transition-colors", 
              isListening ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-semibold" : "bg-white text-slate-600 hover:bg-slate-50 hover:text-amber-700 border-slate-200"
            )}
          >
            {isListening ? (
              <>
                <div className="mr-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Listening
              </>
            ) : <Mic className="h-5 w-5" />}
          </Button>
        )}
        <Button
          onClick={() => onSubmit()}
          disabled={isSending || !value.trim()}
          className="h-11 shrink-0 rounded-full bg-amber-800 px-4 text-white hover:bg-amber-900"
        >
          <ArrowUp className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="text-[11px] leading-5 text-slate-500">
          Enter sends. Shift + Enter creates a new line.
        </p>
      </div>
    </motion.div>
  );
}

function ChatMessages({
  messages,
  isSending,
  onSelectImage,
  endRef,
  selectedLang,
}: ChatMessagesProps) {
  const [isPlayingId, setIsPlayingId] = useState<number | null>(null);

  const playTTS = async (text: string, id: number, languageCode: string, voiceName: string) => {
    setIsPlayingId(id);
    try {
      const ttsRes = await axios.post("/api/tts", { 
        text: stripFormattedContentForTyping(text),
        languageCode,
        voiceName
      });
      if (ttsRes.data.audioContent) {
        const audio = new Audio("data:audio/mp3;base64," + ttsRes.data.audioContent);
        audio.onended = () => setIsPlayingId(null);
        audio.play().catch(e => {
          console.error("Manual playback failed", e);
          setIsPlayingId(null);
        });
      } else {
        setIsPlayingId(null);
      }
    } catch (err) {
      console.error("TTS failed", err);
      setIsPlayingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-0 md:pr-1"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-4 pt-2">
        {messages.map((message) => {
          const isAssistant = message.role === "assistant";
          const hasContent = Boolean(message.content?.trim());

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={cn("flex", isAssistant ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "rounded-[1.7rem] border p-4 shadow-sm md:p-5",
                  isAssistant
                    ? "w-full max-w-4xl border-amber-100 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(255,249,235,0.72)_100%)]"
                    : "w-fit max-w-[85%] border-amber-200 bg-amber-50/90 md:max-w-[38rem]",
                )}
              >
                {isAssistant && hasContent ? (
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      GoldCraft Curated
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-7 w-7 rounded-full text-amber-700 hover:bg-amber-100/50 hover:text-amber-800 transition-colors", isPlayingId === message.id && "animate-pulse bg-amber-100")}
                      onClick={() => playTTS(message.content, message.id, selectedLang.value, selectedLang.voice)}
                    >
                      <Volume2 className={cn("h-3.5 w-3.5", isPlayingId === message.id && "fill-amber-700")} />
                    </Button>
                  </div>
                ) : null}

                {isAssistant && hasContent ? (
                  <AnimatedMessage
                    text={message.content}
                    animate={message.animate && !message.images.length}
                  />
                ) : null}

                {!isAssistant ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-900 md:text-[15px]">
                    {message.content}
                  </p>
                ) : null}

                {message.images.length ? (
                  <div className={hasContent ? "mt-5" : "mt-0"}>
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                      <Search className="h-3.5 w-3.5" />
                      Visual References
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {message.images.map((image) => (
                        <button
                          key={image}
                          type="button"
                          onClick={() => onSelectImage(image)}
                          className="group relative overflow-hidden rounded-[1.5rem] border border-amber-100 bg-amber-50/40 text-left shadow-sm transition-colors hover:border-amber-300"
                        >
                          <img
                            src={image}
                            alt="Chat response visual"
                            className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/60 via-black/10 to-transparent px-4 py-3 text-white">
                            <span className="text-sm font-medium">Open preview</span>
                            <ZoomIn className="h-4 w-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {message.sources.length && !message.images.length ? (
                  <div className="mt-5 rounded-[1.5rem] border border-amber-100 bg-amber-50/45 p-3.5">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                      <Search className="h-3.5 w-3.5" />
                      Curated References
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {message.sources.map((source, index) => (
                        <Link
                          key={`${source.url}-${index}`}
                          href={source.url}
                          target="_blank"
                          className="group rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-sm transition-colors hover:border-amber-200 hover:bg-white"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {source.title || source.url}
                              </p>
                              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-amber-700">
                                {getSourceHost(source.url)}
                              </p>
                            </div>
                            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </div>
                          {cleanSourceText(source.content) ? (
                            <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                              {cleanSourceText(source.content)}
                            </p>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}

        {isSending ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-3 rounded-[1.6rem] border border-amber-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <LoaderCircle className="h-4 w-4 animate-spin text-amber-700" />
              GoldCraft AI is thinking...
            </div>
          </div>
        ) : null}

        <div ref={endRef} />
      </div>
    </motion.div>
  );
}

function ChatPage({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: ChatMessageView[];
}) {
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [hasStartedChat, setHasStartedChat] = useState(initialMessages.length > 0);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<"chat" | "voice">("chat");
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (hasStartedChat) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isSending, hasStartedChat]);

  const handleSubmit = async (overrideValue?: string) => {
    const value = (overrideValue ?? input).trim();

    if (!value || isSending) {
      return;
    }

    if (!hasStartedChat) {
      setHasStartedChat(true);
    }

    const optimisticUserMessage: ChatMessageView = {
      id: Date.now(),
      role: "user",
      content: value,
      images: [],
      sources: [],
    };

    setMessages((current) => [...current, optimisticUserMessage]);
    setInput("");
    setIsSending(true);

    try {
      const result = await axios.post(`/api/chats/${chatId}/messages`, {
        message: value,
      });

      const assistantMessage = result.data.message as ChatMessageView;
      const shouldAnimate = !assistantMessage.images?.length;

      setMessages((current) => [
        ...current,
        {
          ...assistantMessage,
          images: assistantMessage.images ?? [],
          sources: assistantMessage.sources ?? [],
          animate: shouldAnimate,
        },
      ]);

      if (interactionMode === "voice" && assistantMessage.content) {
        // Find the unique ID from messages or use a temp one
        try {
          const ttsRes = await axios.post("/api/tts", { 
            text: stripFormattedContentForTyping(assistantMessage.content),
            languageCode: selectedLang.value,
            voiceName: selectedLang.voice
          });
          if (ttsRes.data.audioContent) {
            const audioSrc = "data:audio/mp3;base64," + ttsRes.data.audioContent;
            const audio = new Audio(audioSrc);
            
            audio.play().catch(e => {
              console.warn("Auto-playback blocked. User must interact.", e);
            });
          }
        } catch (err) {
          console.error("Background TTS play failed", err);
        }
      }
    } catch (err) {
      console.error("Submit error", err);
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "I ran into an issue while preparing the response. Please try again.",
          images: [],
          sources: [],
          animate: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden px-3 pb-3 pt-3 md:px-6 md:pb-5 md:pt-4">
        {/* Chat Control Header */}
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-100 bg-white/90 text-sm text-slate-700 shadow-sm cursor-pointer hover:border-amber-200 transition-colors">
                <Languages className="h-4 w-4 text-amber-700" />
                <span className="font-medium text-xs">{selectedLang.label}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-amber-50 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                {LANGUAGES.map((lang) => (
                  <button 
                    key={lang.value}
                    onClick={() => setSelectedLang(lang)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-amber-50 transition-colors",
                      selectedLang.value === lang.value ? "text-amber-700 bg-amber-50/50" : "text-slate-600"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100/80 backdrop-blur rounded-full p-[3px] border border-slate-200/50 shadow-sm">
            <button 
              type="button"
              onClick={() => setInteractionMode("chat")}
              className={cn(
                "px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-300", 
                interactionMode === "chat" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Chat
            </button>
            <button 
              type="button"
              onClick={() => setInteractionMode("voice")}
              className={cn(
                "px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-300", 
                interactionMode === "voice" ? "bg-white shadow-[0_0_10px_rgba(212,169,90,0.1)] text-amber-700 border border-amber-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Voice
            </button>
          </div>
        </div>

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
          className={cn(
            "mx-auto flex h-full w-full max-w-5xl flex-col",
            hasStartedChat ? "min-h-0 justify-end" : "justify-center",
          )}
        >
          {!hasStartedChat ? (
            <motion.div
              layout
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="mx-auto -mt-32 mb-4 w-full max-w-3xl text-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">
                GoldCraft AI
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Need any suggestions?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-slate-600 md:text-base">
                Ask for a ring idea, a jewelry image, gold market insight, or design inspiration.
              </p>
            </motion.div>
          ) : null}

          <AnimatePresence initial={false}>
            {hasStartedChat ? (
              <ChatMessages
                messages={messages}
                isSending={isSending}
                onSelectImage={setSelectedImage}
                endRef={endRef}
                selectedLang={selectedLang}
              />
            ) : null}
          </AnimatePresence>

          <motion.div
            layout
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
            className={cn("mx-auto flex w-full justify-center", hasStartedChat ? "mt-4" : "mt-1")}
          >
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isSending={isSending}
              hasStartedChat={hasStartedChat}
              interactionMode={interactionMode}
              setInteractionMode={setInteractionMode}
              selectedLang={selectedLang}
            />
          </motion.div>
        </motion.div>
      </div>
      <Dialog
        open={Boolean(selectedImage)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedImage(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl overflow-hidden border-amber-100 bg-[#fffdf8] p-0 shadow-2xl">
          <DialogHeader className="border-b border-amber-100 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Visual reference preview
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Expanded image from your GoldCraft AI search results.
            </DialogDescription>
          </DialogHeader>
          {selectedImage ? (
            <div className="bg-[linear-gradient(180deg,#fffefb_0%,#fff7e6_100%)] p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Expanded visual reference"
                className="max-h-[72vh] w-full rounded-[1.5rem] border border-amber-100 object-contain bg-white shadow-sm"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AIChatConversation(props: {
  chatId: string;
  initialMessages: ChatMessageView[];
}) {
  return <ChatPage {...props} />;
}