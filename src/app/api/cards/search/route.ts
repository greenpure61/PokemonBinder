import { NextResponse } from "next/server";
import { searchCards } from "@/lib/pokemontcg";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 20);
  const setId = searchParams.get("setId") ?? undefined;
  const supertype = searchParams.get("supertype") ?? undefined;
  const types = searchParams.get("types")?.split(",").filter(Boolean);

  try {
    const data = await searchCards({ query, page, pageSize, setId, supertype, types });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
