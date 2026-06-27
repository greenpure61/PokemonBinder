import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireUserId, withApiHandler } from "@/lib/api";
import { wishlistItemSchema } from "@/lib/schemas";

export const GET = withApiHandler(async () => {
  const userId = await requireUserId();

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
});

export const POST = withApiHandler(async (req) => {
  const userId = await requireUserId();
  const { cardId, cardName, cardImageSmall, cardSet } = await parseBody(req, wishlistItemSchema);

  const item = await prisma.wishlistItem.upsert({
    where: { userId_cardId: { userId, cardId } },
    create: { userId, cardId, cardName, cardImageSmall, cardSet },
    update: {},
  });
  return NextResponse.json(item, { status: 201 });
});
