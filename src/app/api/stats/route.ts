import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [binders, filledSlots] = await Promise.all([
    prisma.binder.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        pageCount: true,
        pocketLayout: true,
        coverColor: true,
        _count: { select: { pages: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.cardSlot.findMany({
      where: { cardId: { not: null }, page: { binder: { userId } } },
      select: { cardId: true, cardName: true, cardSet: true },
    }),
  ]);

  // Cards by set (top 10)
  const setCounts: Record<string, number> = {};
  for (const s of filledSlots) {
    const key = s.cardSet ?? "Unknown";
    setCounts[key] = (setCounts[key] ?? 0) + 1;
  }
  const bySet = Object.entries(setCounts)
    .map(([set, count]) => ({ set, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    totalCards: filledSlots.length,
    totalBinders: binders.length,
    bySet,
    binders,
  });
}
