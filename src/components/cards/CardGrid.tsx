"use client";

import { useEffect, useRef } from "react";
import { CardThumbnail } from "./CardThumbnail";
import type { PokeTCGCard } from "@/types/pokemontcg";

interface Props {
  cards: PokeTCGCard[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  emptyMessage?: string;
  onZoom?: (cardId: string, cardName: string, cardImageSmall: string) => void;
  ownedCardIds?: Set<string>;
}

export function CardGrid({ cards, isLoading, hasMore, onLoadMore, emptyMessage, onZoom, ownedCardIds }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    // Don't create an observer at all when there's nothing left to load
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !isLoading) onLoadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (!isLoading && cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <p className="text-xs text-white/30">{emptyMessage ?? "No cards found"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1 px-3 pb-3">
      <div className="grid grid-cols-3 gap-1.5">
        {cards.map((card) => (
          <CardThumbnail key={card.id} card={card} onZoom={onZoom} isOwned={ownedCardIds?.has(card.id)} />
        ))}
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2.5/3.5] rounded-lg bg-white/5 animate-pulse" />
          ))}
      </div>
      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
