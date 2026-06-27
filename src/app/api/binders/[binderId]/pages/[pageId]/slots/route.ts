import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, parseBody, requireUserId, withApiHandler } from "@/lib/api";
import { updateSlotsSchema } from "@/lib/schemas";
import { getSlotsPerPage } from "@/lib/utils";

type Ctx = { params: Promise<{ binderId: string; pageId: string }> };

export const PUT = withApiHandler<Ctx>(async (req, ctx) => {
  const userId = await requireUserId();
  const { binderId, pageId } = await ctx.params;

  const page = await prisma.binderPage.findFirst({
    where: { id: pageId, binderId, binder: { userId } },
    include: { binder: { select: { pocketLayout: true } } },
  });
  if (!page) throw new ApiError(404, "Not found");

  const { slots } = await parseBody(req, updateSlotsSchema);

  // Reject slot indexes outside this binder's layout, and duplicates (which
  // would otherwise upsert the same row twice in one request).
  const slotsPerPage = getSlotsPerPage(page.binder.pocketLayout);
  const seen = new Set<number>();
  for (const slot of slots) {
    if (slot.slotIndex >= slotsPerPage) {
      throw new ApiError(400, `slotIndex ${slot.slotIndex} is out of range for this binder layout`);
    }
    if (seen.has(slot.slotIndex)) {
      throw new ApiError(400, `Duplicate slotIndex ${slot.slotIndex}`);
    }
    seen.add(slot.slotIndex);
  }

  // Apply all slot writes atomically so a partial failure can't leave the page
  // half-updated. Sequential within the transaction (slots are bounded to <=12).
  const updated = await prisma.$transaction(async (tx) => {
    for (const slot of slots) {
      await tx.cardSlot.upsert({
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
      });
    }
    return tx.binderPage.findUnique({
      where: { id: pageId },
      include: { slots: { orderBy: { slotIndex: "asc" } } },
    });
  });

  return NextResponse.json(updated);
});
