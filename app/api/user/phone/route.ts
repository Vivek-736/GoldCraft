import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";

const PHONE_REGEX = /^[+]?[(]?[0-9\s-]{8,20}$/;

export async function PATCH(request: Request) {
  try {
    const { userId, redirectToSignIn } = await auth();

    if (!userId) {
      return redirectToSignIn();
    }

    const clerkUser = await currentUser();

    if (!clerkUser?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json(
        { error: "Unable to resolve the signed-in user email." },
        { status: 400 },
      );
    }

    const { phoneNumber } = await request.json();
    const normalizedPhone = String(phoneNumber ?? "").trim();

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 },
      );
    }

    if (!PHONE_REGEX.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "Enter a valid mobile number." },
        { status: 400 },
      );
    }

    const email = clerkUser.primaryEmailAddress.emailAddress;
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (!existingUser.length) {
      const inserted = await db
        .insert(usersTable)
        .values({
          name: clerkUser.fullName ?? "GoldCraft User",
          email,
          imageUrl: clerkUser.imageUrl,
          phoneNumber: normalizedPhone,
        })
        .returning();

      return NextResponse.json(inserted[0]);
    }

    const updated = await db
      .update(usersTable)
      .set({ phoneNumber: normalizedPhone })
      .where(
        and(
          eq(usersTable.id, existingUser[0].id),
          eq(usersTable.email, email),
        ),
      )
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Unable to update the phone number." },
      { status: 500 },
    );
  }
}