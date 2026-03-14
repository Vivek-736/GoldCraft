import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { ensureUsersTableSchema } from "@/lib/user-profile";

async function ensureUserCredits(email: string, name: string, imageUrl: string) {
  await ensureUsersTableSchema();

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing[0]) {
    return existing[0];
  }

  const inserted = await db
    .insert(usersTable)
    .values({
      email,
      name,
      imageUrl,
      credits: 4,
      creditsUpdatedAt: new Date(),
    })
    .returning();

  return inserted[0];
}

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? null;

    if (!email) {
      return NextResponse.json(
        { error: "Unable to resolve signed-in user." },
        { status: 400 },
      );
    }

    const record = await ensureUserCredits(
      email,
      user?.fullName ?? "GoldCraft User",
      user?.imageUrl ?? "",
    );

    const currentCredits = Number(record.credits ?? 0);

    if (currentCredits <= 0) {
      return NextResponse.json(
        {
          error: "No credits left. Please upgrade to continue.",
          credits: 0,
        },
        { status: 402 },
      );
    }

    const updated = await db
      .update(usersTable)
      .set({
        credits: currentCredits - 1,
        creditsUpdatedAt: new Date(),
      })
      .where(eq(usersTable.email, email))
      .returning();

    return NextResponse.json({
      credits: Number(updated[0]?.credits ?? currentCredits - 1),
      consumed: 1,
    });
  } catch (error) {
    console.error("Failed to consume credit", error);
    
    return NextResponse.json({ error: "Unable to consume credit." }, { status: 500 });
  }
}