"use client";

import { useEffect, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Check } from "lucide-react";
import type { PokeTCGCard } from "@/types/pokemontcg";
import type { DragItem } from "@/types/dnd";
import { cn } from "@/lib/utils";
import { CardImage } from "@/components/cards/CardImage";
import { useBinderStore } from "@/store/binderStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface Props {
  card: PokeTCGCard;
  onZoom?: (cardId: string, cardName: string, cardImageSmall: string) => void;
  isOwned?: boolean;
}

export function CardThumbnail({ card, onZoom, isOwned }: Props) {
  const armCard = useBinderStore((s) => s.armCard);
  const isArmed = useBinderStore((s) => s.armedCard?.cardId === card.id);
  const isCoarse = useMediaQuery("(pointer: coarse)");

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

  // Track whether dnd-kit actually activated a drag so we can suppress the click
  const wasDragging = useRef(false);
  useEffect(() => {
    if (isDragging) wasDragging.current = true;
  }, [isDragging]);

  function handleClick() {
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }
    // Touch: tap arms the card for tap-to-place (the search drawer covers the
    // binder, so dragging across isn't possible); tapping again disarms it.
    // Pointer devices keep tap-to-zoom and use drag to place.
    if (isCoarse) {
      armCard(isArmed ? null : { cardId: card.id, cardName: card.name, cardImageSmall: card.images.small, cardSet: card.set.name });
    } else {
      onZoom?.(card.id, card.name, card.images.small);
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={cn(
        "group relative aspect-[2.5/3.5] cursor-grab overflow-hidden rounded-lg bg-surface-muted transition-all duration-200 active:cursor-grabbing",
        "hover:z-10 hover:-translate-y-0.5 hover:scale-[1.08] hover:shadow-lg hover:ring-2 hover:ring-primary/40",
        isDragging && "scale-95 opacity-30",
        isArmed && "z-10 -translate-y-0.5 ring-2 ring-primary"
      )}
    >
      <CardImage
        src={card.images.small}
        alt={card.name}
        name={card.name}
        sizes="100px"
        className="select-none object-cover"
        nameClassName="text-[9px]"
        draggable={false}
      />

      {/* Owned badge */}
      {isOwned && (
        <div className="absolute left-1 top-1 z-10 rounded-full bg-success p-0.5 shadow-md">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Armed-for-placement badge */}
      {isArmed && (
        <div className="absolute right-1 top-1 z-10 rounded-md bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-foreground shadow">
          Placing
        </div>
      )}

      {/* Name + set on hover */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end gap-0.5 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-[9px] font-semibold leading-tight text-white">{card.name}</p>
        <p className="truncate text-[8px] leading-tight text-white/60">{card.set.name}</p>
      </div>
    </div>
  );
}
