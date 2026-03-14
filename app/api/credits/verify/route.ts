import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUsersTableSchema } from "@/lib/user-profile";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { db } from "@/config/db";

export const runtime = "nodejs";

const CREDIT_PRICE_INR = 100;

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

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const keyId = process.env.NEXT_PUBLIC_KEY_ID;
    const keySecret = process.env.KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay secret key is missing." },
        { status: 500 },
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields." },
        { status: 400 },
      );
    }

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 },
      );
    }

    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

    const orderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
        cache: "no-store",
      },
    );

    const orderPayload = await orderResponse.json();

    if (!orderResponse.ok) {
      return NextResponse.json(
        { error: "Unable to verify credits order details." },
        { status: 500 },
      );
    }

    const amountPaise = Number(orderPayload?.amount);

    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      return NextResponse.json(
        { error: "Invalid credits order amount." },
        { status: 400 },
      );
    }

    const creditsToAdd = Math.max(1, Math.round(amountPaise / (CREDIT_PRICE_INR * 100)));

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

    const updated = await db
      .update(usersTable)
      .set({
        credits: currentCredits + creditsToAdd,
        creditsUpdatedAt: new Date(),
      })
      .where(eq(usersTable.email, email))
      .returning();

    return NextResponse.json({
      success: true,
      creditsAdded: creditsToAdd,
      credits: Number(updated[0]?.credits ?? currentCredits + creditsToAdd),
    });
  } catch (error) {
    console.error("Credits payment verification failed", error);
    return NextResponse.json(
      { error: "Unable to verify credits payment." },
      { status: 500 },
    );
  }
}