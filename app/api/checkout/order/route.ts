import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json(
        { error: "Unable to resolve signed-in user." },
        { status: 400 },
      );
    }

    const keyId = process.env.NEXT_PUBLIC_KEY_ID;
    const keySecret = process.env.KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay keys are missing in environment." },
        { status: 500 },
      );
    }

    const { amountInr, receipt } = await request.json();
    const normalizedAmountInr = Number(amountInr);

    if (!Number.isFinite(normalizedAmountInr) || normalizedAmountInr <= 0) {
      return NextResponse.json(
        { error: "Checkout amount must be greater than zero." },
        { status: 400 },
      );
    }

    const amountPaise = Math.round(normalizedAmountInr * 100);
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: typeof receipt === "string" && receipt.trim()
          ? receipt.trim().slice(0, 40)
          : `goldcraft_${Date.now()}`,
      }),
      cache: "no-store",
    });

    const payload = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      return NextResponse.json(
        { error: payload?.error?.description ?? "Failed to create Razorpay order." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      keyId,
      order: payload,
    });
  } catch (error) {
    console.error("Razorpay order creation failed", error);
    return NextResponse.json(
      { error: "Unable to initialize checkout." },
      { status: 500 },
    );
  }
}