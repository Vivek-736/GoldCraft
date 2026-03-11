"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import axios from "axios";
import { LoaderCircle, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type ChatHistoryItem = {
  chatId: string;
  title: string;
  updatedAt: string;
};

type ChatSection = {
  label: string;
  chats: ChatHistoryItem[];
};

function getLocalDateStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getSectionLabel(date: Date) {
  const today = getLocalDateStart(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const target = getLocalDateStart(date);

  if (target.getTime() === today.getTime()) {
    return "Today";
  }

  if (target.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMetaDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function AIChatShell({
  chats,
  children,
}: {
  chats: ChatHistoryItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const groupedChats = useMemo<ChatSection[]>(() => {
    const sections = new Map<string, ChatHistoryItem[]>();

    chats.forEach((chat) => {
      const date = new Date(chat.updatedAt);
      const label = getSectionLabel(date);
      const bucket = sections.get(label) ?? [];
      bucket.push(chat);
      sections.set(label, bucket);
    });

    return Array.from(sections.entries()).map(([label, sectionChats]) => ({
      label,
      chats: sectionChats,
    }));
  }, [chats]);

  const createNewChat = async () => {
    try {
      setIsCreating(true);
      const result = await axios.post("/api/chats");
      router.push(`/dashboard/ai-chat/${result.data.chatId}`);
      router.refresh();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SidebarProvider
      defaultOpen
      className="min-h-screen overflow-hidden"
      style={{
        ["--sidebar-width" as string]: "20rem",
        ["--sidebar-width-mobile" as string]: "18rem",
      }}
    >
      <Sidebar
        variant="inset"
        collapsible="offcanvas"
        className="border-r border-amber-100/70"
      >
        <SidebarHeader className="bg-white/85 px-3 py-4 backdrop-blur-xl">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-white/90 px-3 py-3 shadow-sm transition-colors hover:bg-white"
          >
            <Image
              src="/favicon.png"
              alt="GoldCraft"
              width={34}
              height={34}
              className="rounded-full"
            />
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-amber-700">
                GoldCraft
              </p>
              <p className="text-sm font-semibold text-slate-900">AI Chat</p>
            </div>
          </Link>

          <Button
            onClick={createNewChat}
            disabled={isCreating}
            className="mt-3 h-11 w-full rounded-2xl bg-amber-800 text-white hover:bg-amber-900"
          >
            {isCreating ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Creating
              </>
            ) : (
              <>
                <MessageSquarePlus className="h-4 w-4" />
                New chat
              </>
            )}
          </Button>
        </SidebarHeader>

        <SidebarSeparator className="bg-amber-100" />

        <SidebarContent className="scrollbar-hidden bg-[#fffdf8]">
          {groupedChats.length ? (
            groupedChats.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[0.24em] text-amber-700">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-2 px-2">
                    {section.chats.map((chat) => {
                      const updatedAt = new Date(chat.updatedAt);

                      return (
                        <SidebarMenuItem key={chat.chatId}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === `/dashboard/ai-chat/${chat.chatId}`}
                            className="h-auto rounded-2xl px-3 py-3 data-[active=true]:bg-white data-[active=true]:shadow-sm"
                          >
                            <Link
                              href={`/dashboard/ai-chat/${chat.chatId}`}
                              className="flex w-full min-w-0 flex-col gap-1.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="max-w-47.5 truncate text-sm font-medium text-slate-900">
                                  {chat.title}
                                </span>
                                <span className="shrink-0 text-[11px] text-slate-500">
                                  {formatTime(updatedAt)}
                                </span>
                              </div>
                              <p className="max-w-57.5 truncate text-xs leading-5 text-slate-500">
                                Updated {formatMetaDate(updatedAt)}
                              </p>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))
          ) : (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[0.24em] text-amber-700">
                Chat history
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-3 pb-4 text-sm leading-6 text-slate-500">
                Your saved chats will appear here once you start a conversation.
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="h-[97vh] min-w-0 overflow-hidden bg-[linear-gradient(180deg,#fffefb_0%,#fcfcfc_100%)]">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-amber-100/80 bg-white/80 px-4 py-3 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="h-10 w-10 rounded-full border border-amber-100 bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white" />
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full border border-amber-100 bg-white/90 px-3 py-2 text-slate-900 shadow-sm transition-colors hover:bg-white"
            >
              <Image
                src="/favicon.png"
                alt="GoldCraft"
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800 sm:text-[11px]">
                GoldCraft
              </span>
            </Link>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}