import { NextResponse } from "next/server";
import { getLiveGoldPriceINR } from "@/app/actions/gold-price";

export async function GET() {
  try {
    const data = await getLiveGoldPriceINR();

    if (!data.success) {
      return NextResponse.json(
        { error: data.error ?? "Failed to fetch gold price." },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gold price API failed", error);
    
    return NextResponse.json(
      { error: "Unable to fetch gold rate." },
      { status: 500 },
    );
  }
}