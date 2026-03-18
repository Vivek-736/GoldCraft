import { NextResponse } from "next/server";
import { saveAIDesignEstimate } from "@/lib/ai-design-studio";
import { auth, currentUser } from "@clerk/nextjs/server";

const FIXED_MAKING_CHARGE_PERCENT = 15;
const DEFAULT_GST_PERCENT = 3;

function toFiniteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeEstimateMeta(estimateMeta: string) {
  if (!estimateMeta) {
    return "";
  }

  try {
    const parsed = JSON.parse(estimateMeta) as {
      assumptions?: Record<string, unknown>;
      [key: string]: unknown;
    };

    if (!parsed || typeof parsed !== "object") {
      return estimateMeta;
    }

    return JSON.stringify({
      ...parsed,
      assumptions: {
        ...(parsed.assumptions ?? {}),
        makingChargePercent: FIXED_MAKING_CHARGE_PERCENT,
      },
    });
  } catch {
    return estimateMeta;
  }
}

function computeEstimatedCostFromMeta(estimateMeta: string) {
  if (!estimateMeta) {
    return null;
  }

  try {
    const parsed = JSON.parse(estimateMeta) as {
      assumptions?: Record<string, unknown>;
    };
    const assumptions = parsed?.assumptions;

    if (!assumptions) {
      return null;
    }

    const rate22kPerGram = toFiniteNumber(assumptions.rate22kPerGram);
    const weightGrams = toFiniteNumber(assumptions.weightGrams);
    const gstPercent =
      toFiniteNumber(assumptions.gstPercent) ?? DEFAULT_GST_PERCENT;

    if (!rate22kPerGram || !weightGrams || gstPercent < 0) {
      return null;
    }

    const baseMetalCost = rate22kPerGram * weightGrams;
    const makingCharge =
      (baseMetalCost * FIXED_MAKING_CHARGE_PERCENT) / 100;
    const subTotal = baseMetalCost + makingCharge;
    const gstAmount = (subTotal * gstPercent) / 100;

    return Math.round(subTotal + gstAmount);
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
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

    const { itemId } = await params;
    const parsedId = Number(itemId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return NextResponse.json({ error: "Invalid item id." }, { status: 400 });
    }

    const payload = await request.json();
    const estimatedCostInr = Number(payload?.estimatedCostInr);
    const estimatedWeightGrams = String(payload?.estimatedWeightGrams ?? "").trim();
    const estimateMeta = String(payload?.estimateMeta ?? "").trim();
    const normalizedEstimateMeta = normalizeEstimateMeta(estimateMeta);
    const computedEstimatedCostInr =
      computeEstimatedCostFromMeta(normalizedEstimateMeta);
    const finalEstimatedCostInr = computedEstimatedCostInr ?? estimatedCostInr;

    if (!Number.isFinite(finalEstimatedCostInr) || finalEstimatedCostInr <= 0) {
      return NextResponse.json(
        { error: "Estimated cost must be a positive number." },
        { status: 400 },
      );
    }

    if (!estimatedWeightGrams) {
      return NextResponse.json(
        { error: "Estimated weight is required." },
        { status: 400 },
      );
    }

    const saved = await saveAIDesignEstimate({
      id: parsedId,
      userEmail: email,
      estimatedCostInr: Math.round(finalEstimatedCostInr),
      estimatedWeightGrams,
      estimateMeta: normalizedEstimateMeta,
    });

    if (!saved) {
      return NextResponse.json(
        { error: "Item not found in your cart." },
        { status: 404 },
      );
    }

    return NextResponse.json({ item: saved });
  } catch (error) {
    console.error("Estimate save failed", error);
    
    return NextResponse.json(
      { error: "Unable to save estimate." },
      { status: 500 },
    );
  }
}