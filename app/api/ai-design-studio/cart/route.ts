import { NextResponse } from "next/server";
import { saveAIDesignToCart } from "@/lib/ai-design-studio";
import { persistGeneratedOutputUrl } from "@/lib/ai-design-studio-generation";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await currentUser();
    const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? null;

    if (!primaryEmail) {
      return NextResponse.json(
        { error: "A primary email is required to save to cart." },
        { status: 400 },
      );
    }

    const { mode, prompt, sketchUrl, outputUrl } = await request.json();

    if (mode !== "upload" && mode !== "custom" && mode !== "design") {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }

    const normalizedMode = mode === "upload" ? "upload" : "custom";

    const outputValue = typeof outputUrl === "string" ? outputUrl.trim() : "";

    if (!outputValue) {
      return NextResponse.json(
        { error: "An output image is required before saving." },
        { status: 400 },
      );
    }

    const persistedOutputUrl = await persistGeneratedOutputUrl(outputValue);

    const savedItem = await saveAIDesignToCart({
      userEmail: primaryEmail,
      mode: normalizedMode,
      prompt: typeof prompt === "string" ? prompt.trim() || null : null,
      sketchUrl: typeof sketchUrl === "string" ? sketchUrl : null,
      outputUrl: persistedOutputUrl,
    });

    return NextResponse.json({ item: savedItem, outputUrl: persistedOutputUrl });
  } catch (error) {
    console.error("Save to cart failed", error);
    
    return NextResponse.json(
      { error: "Failed to save this design to cart." },
      { status: 500 },
    );
  }
}