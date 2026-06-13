import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UpdateBinderInput } from "@/types/binder";

type Ctx = { params: Promise<{ binderId: string }> };

async function getAuthorizedBinder(binderId: string, userId: string) {
  return prisma.binder.findFirst({ where: { id: binderId, userId } });
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { binderId } = await ctx.params;
  const binder = await prisma.binder.findFirst({
    where: { id: binderId, userId: session.user.id },
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

export async function PUT(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { binderId } = await ctx.params;
  const existing = await getAuthorizedBinder(binderId, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body: UpdateBinderInput = await req.json();
  const updated = await prisma.binder.update({
    where: { id: binderId },
    data: {
      ...(body.name && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.coverColor && { coverColor: body.coverColor }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { binderId } = await ctx.params;
  const existing = await getAuthorizedBinder(binderId, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.binder.delete({ where: { id: binderId } });
  return new NextResponse(null, { status: 204 });
}
