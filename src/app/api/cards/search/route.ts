import { NextResponse } from "next/server";
import { searchCards } from "@/lib/pokemontcg";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 20);
  const setId = searchParams.get("setId") ?? undefined;
  const orderBy = searchParams.get("orderBy") ?? undefined;
  const types = searchParams.get("types")?.split(",").filter(Boolean);
  const supertypes = searchParams.get("supertypes")?.split(",").filter(Boolean);
  const rarity = searchParams.get("rarity") ?? undefined;
  const lang = searchParams.get("lang") ?? undefined;

  try {
    const data = await searchCards({ query, page, pageSize, setId, orderBy, types, supertypes, rarity, lang });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
