import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

type GeneratePayload = {
  prompt?: string;
  size?: string;
  model?: string;
  quality?: "low" | "medium" | "high";
};

type HuggingFaceErrorPayload = {
  error?: string;
  estimated_time?: number;
};

const DEFAULT_MODEL = "black-forest-labs/FLUX.1-schnell";

function resolveHuggingFaceToken() {
  return (process.env.HF_TOKEN || "").trim();
}

function parseSize(size: string) {
  const match = size.match(/^(\d{2,4})x(\d{2,4})$/i);

  if (!match) {
    return { width: 1024, height: 1024 };
  }

  const width = Number(match[1]);
  const height = Number(match[2]);

  return {
    width: Number.isFinite(width) ? Math.max(256, Math.min(1536, width)) : 1024,
    height: Number.isFinite(height) ? Math.max(256, Math.min(1536, height)) : 1024,
  };
}

async function callHuggingFaceImageApi({
  token,
  prompt,
  model,
  size,
}: {
  token: string;
  prompt: string;
  model: string;
  size: string;
}) {
  const { width, height } = parseSize(size);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 150000);

  try {
    return await fetch(`https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "image/png",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width,
          height,
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

const JEWELRY_KEYWORDS = [
  "jewelry",
  "jewellery",
  "ornament",
  "ring",
  "necklace",
  "pendant",
  "earring",
  "ear ring",
  "nose ring",
  "bangle",
  "bracelet",
  "anklet",
  "waist chain",
  "mangalsutra",
  "chain",
  "gold",
  "diamond",
  "gem",
  "stone",
  "kundan",
  "jhumka",
  "choker",
];

function isJewelryIntent(text: string) {
  const normalized = text.toLowerCase();
  return JEWELRY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const token = resolveHuggingFaceToken();

    if (!token) {
      return NextResponse.json(
        {
          error: "HF_TOKEN is missing in environment.",
        },
        { status: 500 },
      );
    }

    const payload = (await request.json()) as GeneratePayload;
    const prompt = String(payload.prompt ?? "").trim();
    const size = String(payload.size ?? "1024x1024").trim() || "1024x1024";
    const model = String(payload.model ?? "").trim() || DEFAULT_MODEL;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required for image generation." },
        { status: 400 },
      );
    }

    if (!isJewelryIntent(prompt)) {
      return NextResponse.json(
        { error: "Only jewelry and ornament image generation is supported." },
        { status: 400 },
      );
    }

    const generationResponse = await callHuggingFaceImageApi({
      token,
      prompt,
      size,
      model,
    });

    if (!generationResponse.ok) {
      const rawError = await generationResponse.text();
      let parsedErrorMessage = "";

      try {
        const parsed = JSON.parse(rawError) as HuggingFaceErrorPayload;
        parsedErrorMessage = typeof parsed.error === "string" ? parsed.error : "";
      } catch {
        parsedErrorMessage = "";
      }

      const errorMessage =
        parsedErrorMessage ||
        (rawError.trim() ? rawError.slice(0, 400) : "Image generation failed.");

      if (generationResponse.status === 401 || generationResponse.status === 403) {
        return NextResponse.json(
          { error: "Hugging Face authentication failed. Please verify HF_TOKEN." },
          { status: 401 },
        );
      }

      if (generationResponse.status === 429 || generationResponse.status === 503) {
        return NextResponse.json(
          {
            error:
              "Hugging Face model is currently busy or rate-limited. Please retry in a few moments.",
          },
          { status: generationResponse.status },
        );
      }

      return NextResponse.json(
        { error: String(errorMessage) },
        { status: generationResponse.status || 500 },
      );
    }

    const contentTypeHeader = generationResponse.headers.get("content-type") || "image/png";
    const mimeType = contentTypeHeader.split(";")[0]?.trim() || "image/png";
    const imageBuffer = Buffer.from(await generationResponse.arrayBuffer());

    if (imageBuffer.length === 0) {
      return NextResponse.json(
        { error: "Image generation API returned an empty image." },
        { status: 502 },
      );
    }

    const outputUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

    return NextResponse.json({ outputUrl });
  } catch (error) {
    console.error("Design image generation failed", error);
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Image generation timed out. Please try again."
        : "Unable to generate image right now.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}