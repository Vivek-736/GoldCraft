"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ExternalLink,
  LoaderCircle,
  Search,
  Sparkles,
  ZoomIn,
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

export type ChatMessageView = {
  id: number;
  role: "user" | "assistant";
  content: string;
  images: string[];
  sources: Array<{ title: string; url: string; content?: string }>;
  createdAt?: string;
  animate?: boolean;
};

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
        .replace(/<li\b[^>]*>/gi, "• ")
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
      .replace(/^\s*[-*]\s+/gm, "• ")
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

function AnimatedMessage({
  text,
  animate,
}: {
  text: string;
  animate?: boolean;
}) {
  const plainText = stripFormattedContentForTyping(text);
  const [visibleLength, setVisibleLength] = useState(
    animate ? 0 : plainText.length,
  );
  const [isComplete, setIsComplete] = useState(!animate);

  useEffect(() => {
    if (!animate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibleLength(plainText.length);
      setIsComplete(true);
      return;
    }

    setVisibleLength(0);
    setIsComplete(false);

    if (!plainText.length) {
      setIsComplete(true);
      return;
    }

    const interval = window.setInterval(() => {
      setVisibleLength((current) => {
        const next = current + 1;

        if (next >= plainText.length) {
          window.clearInterval(interval);
          setIsComplete(true);
          return plainText.length;
        }

        return next;
      });
    }, 22);

    return () => window.clearInterval(interval);
  }, [animate, plainText]);

  if (!animate || isComplete) {
    return <FinalAssistantMessage text={text} />;
  }

  return (
    <p
      className="whitespace-pre-wrap text-sm leading-7 text-slate-800 md:text-[15px]"
      aria-live="polite"
    >
      {plainText.slice(0, visibleLength)}
      <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse rounded-full bg-amber-700 align-[-2px]" />
    </p>
  );
}

export function AIChatConversation({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: ChatMessageView[];
}) {
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSubmit = async () => {
    const value = input.trim();

    if (!value || isSending) {
      return;
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
    } catch {
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
        <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-1 flex-col">
          <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-0 md:pr-1">
            <div className="space-y-4 pb-4">
              {!messages.length ? (
                <div className="flex min-h-full items-center justify-center py-10 md:py-14">
                  <div className="flex flex-col w-full max-w-xl items-center gap-4 px-5 py-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 p-2">
                      <Search className="h-12 w-12" />
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-xl font-medium text-slate-900 md:text-[15px]">
                        Need any suggestions?
                      </p>
                      <p className="mt-1 text-md leading-6 text-slate-600">
                        Ask for a ring idea, a jewelry image, gold market insight, or design inspiration.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {messages.map((message) => {
                const isAssistant = message.role === "assistant";
                const hasContent = Boolean(message.content?.trim());

                return (
                  <div
                    key={message.id}
                    className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`rounded-[1.7rem] border p-4 shadow-sm md:p-5 ${
                        isAssistant
                          ? "w-full max-w-4xl border-amber-100 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(255,249,235,0.72)_100%)]"
                          : "w-fit max-w-[85%] border-amber-200 bg-amber-50/90 md:max-w-[38rem]"
                      }`}
                    >
                      {isAssistant && hasContent ? (
                        <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                          <Sparkles className="h-3.5 w-3.5" />
                          GoldCraft Curated
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
                                onClick={() => setSelectedImage(image)}
                                className="group relative overflow-hidden rounded-[1.5rem] border border-amber-100 bg-amber-50/40 text-left shadow-sm transition-colors hover:border-amber-300"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={image}
                                  alt="Chat response visual"
                                  className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                />
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/60 via-black/10 to-transparent px-4 py-3 text-white">
                                  <span className="text-sm font-medium">
                                    Open preview
                                  </span>
                                  <ZoomIn className="h-4 w-4" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {message.sources.length && !message.images.length ? (
                        <div
                          className={
                            hasContent || message.images.length
                              ? "mt-5 rounded-[1.5rem] border border-amber-100 bg-amber-50/45 p-3.5"
                              : "rounded-[1.5rem] border border-amber-100 bg-amber-50/45 p-3.5"
                          }
                        >
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
                                className="group rounded-4xl border border-white/80 bg-white/90 p-4 shadow-sm transition-colors hover:border-amber-200 hover:bg-white"
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
                  </div>
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
          </div>

          <div className="mt-3 rounded-[1.9rem] border border-amber-100 bg-white/96 px-4 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:px-5 md:py-3.5">
            <div className="flex items-end gap-3">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask GoldCraft AI about gold, markets, design inspiration, news, startups, images, or developer trends..."
                className="min-h-13.5 max-h-32 flex-1 resize-none border-0 bg-transparent px-0 py-0 text-sm leading-6 shadow-none focus-visible:ring-0"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
              />
              <Button
                onClick={handleSubmit}
                disabled={isSending || !input.trim()}
                className="h-11 shrink-0 rounded-full bg-amber-800 px-4 text-white hover:bg-amber-900"
              >
                <ArrowUp className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] leading-5 text-slate-500">
                Enter sends. Shift + Enter creates a new line.
              </p>
            </div>
          </div>
        </div>
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