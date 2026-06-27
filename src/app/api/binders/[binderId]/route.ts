import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, parseBody, requireUserId, withApiHandler } from "@/lib/api";
import { updateBinderSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ binderId: string }> };

async function getAuthorizedBinder(binderId: string, userId: string) {
  return prisma.binder.findFirst({ where: { id: binderId, userId } });
}

export const GET = withApiHandler<Ctx>(async (_req, ctx) => {
  const userId = await requireUserId();
  const { binderId } = await ctx.params;

  const binder = await prisma.binder.findFirst({
    where: { id: binderId, userId },
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

export const PUT = withApiHandler<Ctx>(async (req, ctx) => {
  const userId = await requireUserId();
  const { binderId } = await ctx.params;

  const existing = await getAuthorizedBinder(binderId, userId);
  if (!existing) throw new ApiError(404, "Not found");

  const body = await parseBody(req, updateBinderSchema);
  const updated = await prisma.binder.update({
    where: { id: binderId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.coverColor !== undefined && { coverColor: body.coverColor }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withApiHandler<Ctx>(async (_req, ctx) => {
  const userId = await requireUserId();
  const { binderId } = await ctx.params;

  const existing = await getAuthorizedBinder(binderId, userId);
  if (!existing) throw new ApiError(404, "Not found");

  await prisma.binder.delete({ where: { id: binderId } });
  return new NextResponse(null, { status: 204 });
});
