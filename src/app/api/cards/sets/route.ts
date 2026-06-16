import { NextResponse } from "next/server";
import { getSets } from "@/lib/pokemontcg";

export async function GET() {
  try {
    const data = await getSets();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch sets";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
