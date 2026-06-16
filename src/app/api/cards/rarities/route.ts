import { NextResponse } from "next/server";
import { getRarities } from "@/lib/pokemontcg";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") ?? undefined;
  try {
    const data = await getRarities(lang);
    return NextResponse.json({ rarities: data }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ rarities: [] });
  }
}
