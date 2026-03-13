import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { markAIDesignItemsOrdered } from "@/lib/ai-design-studio";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const keySecret = process.env.KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay secret key is missing." },
        { status: 500 },
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      itemIds,
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

    const isValid = expected === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 },
      );
    }

    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Unable to resolve signed-in user." },
        { status: 400 },
      );
    }

    const normalizedItemIds = Array.isArray(itemIds)
      ? itemIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : [];

    await markAIDesignItemsOrdered({
      userEmail,
      itemIds: normalizedItemIds,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay verification failed", error);
    
    return NextResponse.json(
      { error: "Unable to verify payment." },
      { status: 500 },
    );
  }
}