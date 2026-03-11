import { asc, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import {
  AIChatConversation,
  type ChatMessageView,
} from "@/components/ai-chat-conversation";
import { db } from "@/config/db";
import { chatMessagesTable, chatsTable } from "@/config/schema";
import { parseStoredList } from "@/lib/ai-chat";

export default async function ChatIdPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!email) {
    return redirectToSignIn();
  }

  const { chatId } = await params;
  const chat = await db
    .select()
    .from(chatsTable)
    .where(eq(chatsTable.chatId, chatId));

  if (!chat.length || chat[0].userEmail !== email) {
    notFound();
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.chatId, chatId))
    .orderBy(asc(chatMessagesTable.createdAt));

  const parsedMessages: ChatMessageView[] = messages.map((message) => ({
    id: message.id,
    role: message.role as "user" | "assistant",
    content: message.content,
    images: parseStoredList(message.images) as string[],
    sources: parseStoredList(message.sources) as Array<{
      title: string;
      url: string;
      content?: string;
    }>,
    createdAt: message.createdAt?.toISOString(),
  }));

  return <AIChatConversation chatId={chatId} initialMessages={parsedMessages} />;
}