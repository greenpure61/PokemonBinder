import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId, cardName, cardImageSmall, cardSet } = await req.json();
  if (!cardId || !cardName) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const item = await prisma.wishlistItem.upsert({
    where: { userId_cardId: { userId: session.user.id, cardId } },
    create: { userId: session.user.id, cardId, cardName, cardImageSmall, cardSet },
    update: {},
  });
  return NextResponse.json(item, { status: 201 });
}
