import { NextResponse } from "next/server";
import { requireUserId, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";

/**
 * Public "Explore" feed: every binder marked public (via the Share button), newest
 * first, with just enough to render a feed card — the owner and the first page's
 * slots for a preview. Signed-in only (the Explore page is gated), but the data is
 * all public binders across every user. See MOBILE.md.
 */

const FEED_LIMIT = 50;

export const GET = withApiHandler(async () => {
  await requireUserId(); // Explore is a signed-in feature; data itself is public binders.

  const binders = await prisma.binder.findMany({
    where: { isPublic: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: FEED_LIMIT,
    select: {
      id: true,
      name: true,
      coverColor: true,
      pocketLayout: true,
      pageCount: true,
      user: { select: { name: true, image: true } },
      // Only the first page is needed for the preview grid.
      pages: {
        where: { pageIndex: 0 },
        take: 1,
        select: {
          slots: { select: { slotIndex: true, cardImageSmall: true, cardName: true } },
        },
      },
    },
  });

  const feed = binders.map((b) => ({
    id: b.id,
    name: b.name,
    coverColor: b.coverColor,
    pocketLayout: b.pocketLayout,
    pageCount: b.pageCount,
    owner: { name: b.user.name, image: b.user.image },
    previewSlots: b.pages[0]?.slots ?? [],
  }));

  return NextResponse.json(feed);
});
