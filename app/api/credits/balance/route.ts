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

export async function GET() {
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

    return NextResponse.json({
      credits: Number(record.credits ?? 0),
    });
  } catch (error) {
    console.error("Failed to load credits", error);
    
    return NextResponse.json({ error: "Unable to load credits." }, { status: 500 });
  }
}