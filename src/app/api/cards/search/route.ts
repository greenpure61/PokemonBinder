import { NextResponse } from "next/server";
import { searchCards } from "@/lib/pokemontcg";
import { parseQuery, withApiHandler } from "@/lib/api";
import { cardSearchQuerySchema } from "@/lib/schemas";

export const GET = withApiHandler(async (req) => {
  const { q, page, pageSize, setId, orderBy, types, supertypes, rarity, lang } = parseQuery(
    req,
    cardSearchQuerySchema
  );

  try {
    const data = await searchCards({
      query: q,
      page,
      pageSize,
      setId,
      orderBy,
      types: types?.split(",").filter(Boolean),
      supertypes: supertypes?.split(",").filter(Boolean),
      rarity,
      lang,
    });
    // No browser caching — upstream TCGdex calls are already cached server-side,
    // and results are post-filtered (Pocket excluded), so they must stay fresh.
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Upstream (TCGdex) failure — distinct from a client error, so 502.
    return NextResponse.json({ error: "Failed to search cards" }, { status: 502 });
  }
});
