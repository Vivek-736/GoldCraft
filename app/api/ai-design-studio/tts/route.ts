import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

type TtsPayload = {
  text?: string;
  languageCode?: string;
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY is missing in environment." },
        { status: 500 },
      );
    }

    const payload = (await request.json()) as TtsPayload & { voiceName?: string };
    const text = String(payload.text ?? "").trim();
    const languageCode = String(payload.languageCode ?? "en-US").trim() || "en-US";
    const voiceName = String(payload.voiceName ?? "").trim();

    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            text,
          },
          voice: {
            languageCode,
            name: voiceName || undefined,
            ssmlGender: "FEMALE",
          },
          audioConfig: {
            audioEncoding: "MP3",
          },
        }),
        cache: "no-store",
      },
    );

    const result = await response.json();

    if (!response.ok || typeof result.audioContent !== "string") {
      return NextResponse.json(
        { error: "Unable to synthesize speech." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      audioContent: result.audioContent,
      mimeType: "audio/mpeg",
    });
  } catch (error) {
    console.error("Text-to-speech failed", error);
    return NextResponse.json({ error: "Unable to create speech." }, { status: 500 });
  }
}