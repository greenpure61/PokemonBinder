import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UpdateSlotInput } from "@/types/binder";

type Ctx = { params: Promise<{ binderId: string; pageId: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { binderId, pageId } = await ctx.params;

  const page = await prisma.binderPage.findFirst({
    where: { id: pageId, binderId, binder: { userId: session.user.id } },
  });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { slots }: { slots: UpdateSlotInput[] } = await req.json();

  await Promise.all(
    slots.map((slot) =>
      prisma.cardSlot.upsert({
        where: { pageId_slotIndex: { pageId, slotIndex: slot.slotIndex } },
        create: {
          pageId,
          slotIndex: slot.slotIndex,
          cardId: slot.cardId,
          cardName: slot.cardName,
          cardImageSmall: slot.cardImageSmall,
          cardSet: slot.cardSet,
        },
        update: {
          cardId: slot.cardId,
          cardName: slot.cardName,
          cardImageSmall: slot.cardImageSmall,
          cardSet: slot.cardSet,
        },
      })
    )
  );

  const updated = await prisma.binderPage.findUnique({
    where: { id: pageId },
    include: { slots: { orderBy: { slotIndex: "asc" } } },
  });

  return NextResponse.json(updated);
}
