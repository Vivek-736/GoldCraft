import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { chatsTable, chatMessagesTable } from "@/config/schema";
import {
  buildAssistantReply,
  generateChatSummary,
  parseStoredList,
} from "@/lib/ai-chat";

export async function POST(
  request: Request,
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
      return NextResponse.json(
        { error: "Unable to resolve user email." },
        { status: 400 },
      );
    }

    const { chatId } = await params;
    const { message } = await request.json();
    const userMessage = String(message ?? "").trim();

    if (!userMessage) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    const chat = await db
      .select()
      .from(chatsTable)
      .where(eq(chatsTable.chatId, chatId));

    if (!chat.length || chat[0].userEmail !== email) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }

    const previousMessages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.chatId, chatId))
      .orderBy(asc(chatMessagesTable.createdAt));

    await db.insert(chatMessagesTable).values({
      chatId,
      role: "user",
      content: userMessage,
      tool: "gemini",
      createdAt: new Date(),
    });

    const history = [
      ...previousMessages.map((item) => ({
        role: item.role as "user" | "assistant",
        content: item.content,
      })),
      { role: "user" as const, content: userMessage },
    ];

    const needsSummary = chat[0].title === "New chat";
    const [assistant, summary] = await Promise.all([
      buildAssistantReply({
        query: userMessage,
        history,
      }),
      needsSummary ? generateChatSummary(userMessage) : Promise.resolve(null),
    ]);

    const insertedAssistant = await db
      .insert(chatMessagesTable)
      .values({
        chatId,
        role: "assistant",
        content: assistant.content,
        images: JSON.stringify(assistant.images),
        sources: JSON.stringify(assistant.sources),
        tool: assistant.mode,
        createdAt: new Date(),
      })
      .returning();

    await db
      .update(chatsTable)
      .set({
        title: summary ?? chat[0].title,
        updatedAt: new Date(),
      })
      .where(
        and(eq(chatsTable.chatId, chatId), eq(chatsTable.userEmail, email)),
      );

    return NextResponse.json({
      message: {
        ...insertedAssistant[0],
        images: parseStoredList(insertedAssistant[0].images),
        sources: parseStoredList(insertedAssistant[0].sources),
      },
      summary: summary ?? chat[0].title,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Unable to send the message." },
      { status: 500 },
    );
  }
}