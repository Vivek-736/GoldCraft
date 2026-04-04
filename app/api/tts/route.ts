import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, languageCode = "en-US", voiceName = "en-US-Standard-C" } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google API key is not configured" },
        { status: 500 }
      );
    }

    // Call Google Cloud Text-to-Speech API
    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        input: { text },
        voice: { languageCode, name: voiceName },
        audioConfig: { audioEncoding: "MP3" },
      }
    );

    const audioContent = response.data.audioContent;

    return NextResponse.json({ audioContent });
  } catch (error: any) {
    console.error("Error generating TTS:", error.response?.data || error.message);
    
    return NextResponse.json(
      { error: "Failed to generate text-to-speech audio" },
      { status: 500 }
    );
  }
}