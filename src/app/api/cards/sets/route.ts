import { NextResponse } from "next/server";
import { getSets } from "@/lib/pokemontcg";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") ?? undefined;
  try {
    const data = await getSets(lang);
    // No browser caching — upstream TCGdex calls are already cached server-side,
    // and the response is post-filtered (Pocket excluded), so it must stay fresh.
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch sets";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
