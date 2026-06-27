import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, withApiHandler } from "@/lib/api";

type Ctx = { params: Promise<{ binderId: string }> };

export const GET = withApiHandler<Ctx>(async (_req, ctx) => {
  const { binderId } = await ctx.params;

  const binder = await prisma.binder.findFirst({
    where: { id: binderId, isPublic: true },
    include: {
      pages: {
        orderBy: { pageIndex: "asc" },
        include: { slots: { orderBy: { slotIndex: "asc" } } },
      },
    },
  });

  if (!binder) throw new ApiError(404, "Not found");
  return NextResponse.json(binder);
});
