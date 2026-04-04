"use server";

import Razorpay from "razorpay";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/config/db";
import { goldTransactionsTable } from "@/config/schema";
import { getLiveGoldPriceINR } from "./gold-price";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_KEY_ID || "",
  key_secret: process.env.KEY_SECRET || "",
});

export async function getUserGoldHoldings() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) throw new Error("User email not found");

    const transactions = await db
      .select()
      .from(goldTransactionsTable)
      .where(
        and(
          eq(goldTransactionsTable.userEmail, email),
          eq(goldTransactionsTable.status, "COMPLETED")
        )
      );

    let totalGrams = 0;
    let totalInvested = 0;

    transactions.forEach((tx) => {
      const grams = parseFloat(tx.grams);
      if (tx.type === "BUY") {
        totalGrams += grams;
        totalInvested += tx.totalAmount;
      } else if (tx.type === "SELL") {
        totalGrams -= grams;
      }
    });

    const livePrice = await getLiveGoldPriceINR();
    const currentPricePerGram = livePrice.success ? livePrice.gram : 0;
    const currentValue = totalGrams * (currentPricePerGram ?? 0);
    const pnl = currentValue - totalInvested;

    return {
      success: true,
      holdings: {
        totalGrams: Math.max(0, totalGrams),
        totalInvested,
        currentValue,
        pnl,
        pnlPercentage: totalInvested > 0 ? (pnl / totalInvested) * 100 : 0,
      },
      transactions: transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    };
  } catch (error) {
    console.error("Error fetching gold holdings:", error);
    return { success: false, error: "Failed to load holdings" };
  }
}

export async function createGoldPurchaseOrder(inrAmount: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) throw new Error("User email not found");

    const livePrice = await getLiveGoldPriceINR();
    if (!livePrice.success || !livePrice.gram) {
      throw new Error("Unable to fetch live gold price");
    }

    const pricePerGram = livePrice.gram;
    const totalAmount = Math.round(inrAmount);
    const calculatedGrams = (totalAmount / pricePerGram).toFixed(6);

    const options = {
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `gold_buy_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    await db.insert(goldTransactionsTable).values({
      userEmail: email,
      type: "BUY",
      grams: calculatedGrams,
      pricePerGram,
      totalAmount,
      status: "PENDING",
      razorpayOrderId: order.id,
    });

    return {
      success: true,
      orderId: order.id,
      amount: totalAmount,
      key: process.env.NEXT_PUBLIC_KEY_ID,
    };
  } catch (error) {
    console.error("Error creating gold purchase order:", error);
    return { success: false, error: "Failed to initiate purchase" };
  }
}

export async function verifyGoldPurchase(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  try {
    const secret = process.env.KEY_SECRET || "";
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw new Error("Invalid signature");
    }

    await db
      .update(goldTransactionsTable)
      .set({
        status: "COMPLETED",
        razorpayPaymentId,
      })
      .where(eq(goldTransactionsTable.razorpayOrderId, razorpayOrderId));

    return { success: true };
  } catch (error) {
    console.error("Error verifying gold purchase:", error);
    return { success: false, error: "Payment verification failed" };
  }
}

export async function sellGold(inrAmount: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) throw new Error("User email not found");

    const livePrice = await getLiveGoldPriceINR();
    if (!livePrice.success || !livePrice.gram) {
      throw new Error("Unable to fetch live gold price");
    }

    const pricePerGram = livePrice.gram;
    const totalAmount = Math.round(inrAmount);
    const calculatedGrams = (totalAmount / pricePerGram).toFixed(6);

    const currentData = await getUserGoldHoldings();
    // @ts-ignore
    if (!currentData.success || currentData.holdings.totalGrams < parseFloat(calculatedGrams)) {
      throw new Error(`Insufficient gold balance to sell ₹${totalAmount}`);
    }

    await db.insert(goldTransactionsTable).values({
      userEmail: email,
      type: "SELL",
      grams: calculatedGrams,
      pricePerGram: Math.round(pricePerGram),
      totalAmount,
      status: "COMPLETED",
    });

    return { success: true, amount: totalAmount };
  } catch (error) {
    console.error("Error selling gold:", error);
    
    return { success: false, error: "Failed to sell gold" };
  }
}