"use client";

import { useDraggable } from "@dnd-kit/core";
import Image from "next/image";
import type { PokeTCGCard } from "@/types/pokemontcg";
import type { DragItem } from "@/types/dnd";

interface Props {
  card: PokeTCGCard;
}

export function CardThumbnail({ card }: Props) {
  const dragData: DragItem = {
    type: "SEARCH_CARD",
    cardId: card.id,
    cardName: card.name,
    cardImageSmall: card.images.small,
    cardSet: card.set.name,
  };

  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `search-${card.id}`,
    data: dragData,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`relative aspect-[2.5/3.5] cursor-grab active:cursor-grabbing rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.08] hover:-translate-y-0.5 hover:z-10 hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:ring-1 hover:ring-white/20 ${
        isDragging ? "opacity-30 scale-95" : ""
      }`}
    >
      <Image
        src={card.images.small}
        alt={card.name}
        fill
        sizes="100px"
        className="object-cover select-none"
        draggable={false}
      />
    </div>
  );
}
