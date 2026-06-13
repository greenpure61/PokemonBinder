import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ binderId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
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

  if (!binder) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(binder);
}
