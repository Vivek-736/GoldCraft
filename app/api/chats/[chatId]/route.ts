import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { chatsTable, chatMessagesTable } from "@/config/schema";
import { parseStoredList } from "@/lib/ai-chat";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const { userId, redirectToSignIn } = await auth();

    if (!userId) {
      return redirectToSignIn();
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "Unable to resolve user email." }, { status: 400 });
    }

    const { chatId } = await params;
    const chat = await db
      .select()
      .from(chatsTable)
      .where(eq(chatsTable.chatId, chatId));

    if (!chat.length || chat[0].userEmail !== email) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.chatId, chatId))
      .orderBy(asc(chatMessagesTable.createdAt));

    return NextResponse.json({
      chat: chat[0],
      messages: messages.map((message) => ({
        ...message,
        images: parseStoredList(message.images),
        sources: parseStoredList(message.sources),
      })),
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Unable to fetch the chat." }, { status: 500 });
  }
}