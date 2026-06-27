import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiHandler } from "@/lib/api";

type Ctx = { params: Promise<{ cardId: string }> };

export const DELETE = withApiHandler<Ctx>(async (_req, ctx) => {
  const userId = await requireUserId();
  const { cardId } = await ctx.params;

  await prisma.wishlistItem.deleteMany({
    where: { userId, cardId },
  });
  return new NextResponse(null, { status: 204 });
});
