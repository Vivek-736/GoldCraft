import { NextResponse } from "next/server";
import { saveAIDesignEstimate } from "@/lib/ai-design-studio";
import { auth, currentUser } from "@clerk/nextjs/server";

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

    if (!Number.isFinite(estimatedCostInr) || estimatedCostInr <= 0) {
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
      estimatedCostInr: Math.round(estimatedCostInr),
      estimatedWeightGrams,
      estimateMeta,
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