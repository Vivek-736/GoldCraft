import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { db } from "@/config/db";
import { chatsTable, usersTable } from "@/config/schema";
import { ensureUsersTableSchema } from "@/lib/user-profile";

async function getSignedInContext() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return { email: null as string | null, redirectToSignIn, user: null };
  }

  const user = await currentUser();

  return {
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    redirectToSignIn,
    user,
  };
}

export async function GET() {
  try {
    const { email, redirectToSignIn } = await getSignedInContext();

    if (!email) {
      return redirectToSignIn();
    }

    const chats = await db
      .select()
      .from(chatsTable)
      .where(eq(chatsTable.userEmail, email))
      .orderBy(desc(chatsTable.updatedAt));

    return NextResponse.json(chats);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Unable to fetch chats." },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    await ensureUsersTableSchema();

    const { email, redirectToSignIn, user } = await getSignedInContext();

    if (!email) {
      return redirectToSignIn();
    }

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (!existingUser.length && user) {
      await db.insert(usersTable).values({
        name: user.fullName ?? "GoldCraft User",
        email,
        imageUrl: user.imageUrl,
        phoneNumber: user.primaryPhoneNumber?.phoneNumber ?? null,
        address: null,
      });
    }

    const chatId = nanoid(12);
    const inserted = await db
      .insert(chatsTable)
      .values({
        chatId,
        userEmail: email,
        title: "New chat",
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(inserted[0], { status: 201 });
  } catch (error) {
    console.log(error);
    
    return NextResponse.json(
      { error: "Unable to create a chat." },
      { status: 500 },
    );
  }
}