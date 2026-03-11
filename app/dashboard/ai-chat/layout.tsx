import { desc, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { AIChatShell } from "@/components/ai-chat-shell";
import { db } from "@/config/db";
import { chatsTable } from "@/config/schema";

export default async function AIChatLayout({
  children,
}: {
  children: React.ReactNode;
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

  const chats = await db
    .select({
      chatId: chatsTable.chatId,
      title: chatsTable.title,
      updatedAt: chatsTable.updatedAt,
    })
    .from(chatsTable)
    .where(eq(chatsTable.userEmail, email))
    .orderBy(desc(chatsTable.updatedAt));

  return (
    <AIChatShell
      chats={chats.map((chat) => ({
        chatId: chat.chatId,
        title: chat.title,
        updatedAt: chat.updatedAt.toISOString(),
      }))}
    >
      {children}
    </AIChatShell>
  );
}