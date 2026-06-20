import { NextResponse } from "next/server";
import { getRarities } from "@/lib/pokemontcg";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") ?? undefined;
  try {
    const data = await getRarities(lang);
    // No browser caching — upstream TCGdex calls are already cached server-side,
    // and the list is post-filtered (Pocket excluded), so it must stay fresh.
    return NextResponse.json({ rarities: data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ rarities: [] });
  }
}
