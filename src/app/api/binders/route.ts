import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireUserId, withApiHandler } from "@/lib/api";
import { createBinderSchema } from "@/lib/schemas";

export const GET = withApiHandler(async () => {
  const userId = await requireUserId();

  const binders = await prisma.binder.findMany({
    where: { userId },
    include: {
      _count: { select: { pages: true } },
      pages: {
        take: 1,
        orderBy: { pageIndex: "asc" },
        include: { slots: { orderBy: { slotIndex: "asc" } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Count filled slots per binder (one query, aggregated in memory)
  const pageCounts = await prisma.binderPage.findMany({
    where: { binder: { userId } },
    select: {
      binderId: true,
      _count: { select: { slots: { where: { cardId: { not: null } } } } },
    },
  });
  const cardCountByBinder = new Map<string, number>();
  for (const p of pageCounts) {
    cardCountByBinder.set(p.binderId, (cardCountByBinder.get(p.binderId) ?? 0) + p._count.slots);
  }

  const withCounts = binders.map((b) => ({ ...b, cardCount: cardCountByBinder.get(b.id) ?? 0 }));

  return NextResponse.json(withCounts);
});

export const POST = withApiHandler(async (req) => {
  const userId = await requireUserId();
  const body = await parseBody(req, createBinderSchema);

  const pageCount = body.pageCount ?? 10;

  const binder = await prisma.binder.create({
    data: {
      userId,
      name: body.name,
      description: body.description,
      coverColor: body.coverColor ?? "#1a1a2e",
      pocketLayout: body.pocketLayout ?? "NINE_POCKET",
      pageCount,
      pages: {
        createMany: {
          data: Array.from({ length: pageCount }, (_, i) => ({ pageIndex: i })),
        },
      },
    },
    include: { pages: { orderBy: { pageIndex: "asc" } } },
  });

  return NextResponse.json(binder, { status: 201 });
});
