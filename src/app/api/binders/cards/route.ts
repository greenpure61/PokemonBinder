import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async () => {
  const userId = await requireUserId();

  const slots = await prisma.cardSlot.findMany({
    where: {
      cardId: { not: null },
      page: { binder: { userId } },
    },
    select: { cardId: true },
    distinct: ["cardId"],
  });

  return NextResponse.json({ cardIds: slots.map((s) => s.cardId).filter(Boolean) });
});
