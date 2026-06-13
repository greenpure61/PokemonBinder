import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicBinderView } from "./PublicBinderView";
import type { Metadata } from "next";

type Props = { params: Promise<{ binderId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { binderId } = await params;
  const binder = await prisma.binder.findFirst({
    where: { id: binderId, isPublic: true },
    select: { name: true },
  });
  return { title: binder ? `${binder.name} — PokemonBinder` : "PokemonBinder" };
}

export default async function PublicBinderPage({ params }: Props) {
  const { binderId } = await params;

  const binder = await prisma.binder.findFirst({
    where: { id: binderId, isPublic: true },
    include: {
      pages: {
        orderBy: { pageIndex: "asc" },
        include: { slots: { orderBy: { slotIndex: "asc" } } },
      },
    },
  });

  if (!binder) notFound();
  return <PublicBinderView binder={binder} />;
}
