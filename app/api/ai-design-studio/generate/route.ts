import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Generation now runs in the browser through Puter. Use the studio page to generate visuals.",
    },
    { status: 410 },
  );
}