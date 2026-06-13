import { NextResponse } from "next/server";
import { getCardById } from "@/lib/pokemontcg";

type Ctx = { params: Promise<{ cardId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { cardId } = await ctx.params;
  try {
    const card = await getCardById(cardId);
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(card);
  } catch {
    return NextResponse.json({ error: "Failed to fetch card" }, { status: 502 });
  }
}
