import { auth } from "@clerk/nextjs/server";
import { uploadSketchFile } from "@/lib/ai-design-studio-generation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please provide an image file." },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are supported." },
        { status: 400 },
      );
    }

    const uploaded = await uploadSketchFile(file);

    return NextResponse.json(uploaded);
  } catch (error) {
    console.error("Sketch upload failed", error);
    return NextResponse.json(
      { error: "Failed to upload the sketch." },
      { status: 500 },
    );
  }
}