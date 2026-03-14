import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const CREDIT_PRICE_INR = 100;

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
        { error: "Razorpay keys are missing in environment." },
        { status: 500 },
      );
    }

    const payload = await request.json();
    const credits = Number(payload?.credits);

    if (!Number.isInteger(credits) || credits <= 0 || credits > 20) {
      return NextResponse.json(
        { error: "Credits quantity must be an integer between 1 and 20." },
        { status: 400 },
      );
    }

    const amountInr = credits * CREDIT_PRICE_INR;
    const amountPaise = amountInr * 100;
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
        receipt: `credits_${credits}_${Date.now()}`.slice(0, 40),
        notes: {
          purpose: "credits-topup",
          credits,
          pricePerCreditInr: CREDIT_PRICE_INR,
        },
      }),
      cache: "no-store",
    });

    const razorpayPayload = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      return NextResponse.json(
        {
          error:
            razorpayPayload?.error?.description ??
            "Failed to create Razorpay credits order.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      keyId,
      order: razorpayPayload,
      amountInr,
      credits,
      creditPriceInr: CREDIT_PRICE_INR,
    });
  } catch (error) {
    console.error("Credits order creation failed", error);
    return NextResponse.json(
      { error: "Unable to initialize credits checkout." },
      { status: 500 },
    );
  }
}