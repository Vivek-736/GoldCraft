import { desc, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { db } from "@/config/db";
import { chatsTable } from "@/config/schema";

export default async function AIChatPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!email) {
    return redirectToSignIn();
  }

  const existingChat = await db
    .select()
    .from(chatsTable)
    .where(eq(chatsTable.userEmail, email))
    .orderBy(desc(chatsTable.updatedAt));

  if (existingChat.length) {
    redirect(`/dashboard/ai-chat/${existingChat[0].chatId}`);
  }

  const chatId = nanoid(12);
  
  await db.insert(chatsTable).values({
    chatId,
    userEmail: email,
    title: "New chat",
    updatedAt: new Date(),
  });

  redirect(`/dashboard/ai-chat/${chatId}`);
}