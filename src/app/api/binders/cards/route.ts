import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slots = await prisma.cardSlot.findMany({
    where: {
      cardId: { not: null },
      page: { binder: { userId: session.user.id } },
    },
    select: { cardId: true },
    distinct: ["cardId"],
  });

  return NextResponse.json({ cardIds: slots.map((s) => s.cardId).filter(Boolean) });
}
