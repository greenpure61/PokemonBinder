import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ cardId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await ctx.params;
  await prisma.wishlistItem.deleteMany({
    where: { userId: session.user.id, cardId },
  });
  return new NextResponse(null, { status: 204 });
}
