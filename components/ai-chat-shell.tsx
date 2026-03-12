"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
        ["--sidebar-width" as string]: "18rem",
        ["--sidebar-width-mobile" as string]: "16rem",
      }}
    >
      <Sidebar
        variant="inset"
        collapsible="offcanvas"
        className="border-r border-amber-100/70"
      >
        <SidebarHeader className="bg-white/85 px-2.5 py-3 backdrop-blur-xl">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-xl border border-amber-100 bg-white/90 px-2.5 py-2.5 shadow-sm transition-colors hover:bg-white"
          >
            <Image
              src="/favicon.png"
              alt="GoldCraft"
              width={30}
              height={30}
              className="rounded-full"
            />
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-amber-700">
                GoldCraft
              </p>
              <p className="text-sm font-semibold text-slate-900">AI Chat</p>
            </div>
          </Link>

          <Button
            onClick={createNewChat}
            disabled={isCreating}
            className="mt-2.5 h-10 w-full cursor-pointer rounded-xl bg-amber-800 text-white hover:bg-amber-900"
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
          <SidebarGroup>
            <SidebarGroupLabel className="px-2.5 text-[11px] uppercase tracking-[0.22em] text-amber-700">
              Chats
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {chats.length ? (
                <SidebarMenu className="gap-1 px-1.5">
                  {chats.map((chat) => (
                    <SidebarMenuItem key={chat.chatId}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/dashboard/ai-chat/${chat.chatId}`}
                        className="h-auto rounded-xl px-2.5 py-2 data-[active=true]:bg-white data-[active=true]:shadow-sm"
                      >
                        <Link
                          href={`/dashboard/ai-chat/${chat.chatId}`}
                          className="flex w-full min-w-0"
                        >
                          <span className="line-clamp-2 text-[13px] leading-5 text-slate-700 data-[active=true]:text-slate-900">
                            {chat.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              ) : (
                <div className="px-2.5 pb-4 text-sm leading-6 text-slate-500">
                  Your saved chats will appear here once you start a conversation.
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
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