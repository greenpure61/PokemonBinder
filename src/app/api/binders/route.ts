import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CreateBinderInput } from "@/types/binder";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const binders = await prisma.binder.findMany({
    where: { userId: session.user.id },
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
    where: { binder: { userId: session.user.id } },
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
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: CreateBinderInput = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const pageCount = body.pageCount ?? 10;

  const binder = await prisma.binder.create({
    data: {
      userId: session.user.id,
      name: body.name.trim(),
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
}
