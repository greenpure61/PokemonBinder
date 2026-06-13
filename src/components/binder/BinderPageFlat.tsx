"use client";

import { CardSlotFlat } from "./CardSlotFlat";
import type { BinderPageWithSlots } from "@/types/binder";
import { getSlotsPerPage, getGridCols } from "@/lib/utils";
import type { BinderLayout } from "@prisma/client";

interface PageProps {
  page: BinderPageWithSlots;
  layout: BinderLayout;
  onZoom: (cardId: string, cardName: string, cardImageSmall: string) => void;
  onRemove: (pageId: string, slotIndex: number) => void;
}

function SinglePage({ page, layout, onZoom, onRemove }: PageProps) {
  const slotCount = getSlotsPerPage(layout);
  const cols = getGridCols(layout);

  return (
    <div className="flex-1 bg-[#12182b] rounded-2xl p-4 border border-white/5 shadow-xl min-w-0">
      <div
        className="grid gap-2 h-full"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: slotCount }).map((_, i) => {
          const slot = page.slots.find((s) => s.slotIndex === i);
          return (
            <CardSlotFlat
              key={i}
              pageId={page.id}
              slotIndex={i}
              slot={slot}
              onZoom={onZoom}
              onRemove={onRemove}
            />
          );
        })}
      </div>
    </div>
  );
}

interface SpreadProps {
  leftPage: BinderPageWithSlots | undefined;
  rightPage: BinderPageWithSlots | undefined;
  layout: BinderLayout;
  onZoom: (cardId: string, cardName: string, cardImageSmall: string) => void;
  onRemove: (pageId: string, slotIndex: number) => void;
}

export function BinderPageFlat({ leftPage, rightPage, layout, onZoom, onRemove }: SpreadProps) {
  return (
    <div className="flex gap-3 w-full h-full">
      {leftPage ? (
        <SinglePage page={leftPage} layout={layout} onZoom={onZoom} onRemove={onRemove} />
      ) : (
        <div className="flex-1 rounded-2xl bg-[#0d1220] border border-white/5" />
      )}
      {rightPage ? (
        <SinglePage page={rightPage} layout={layout} onZoom={onZoom} onRemove={onRemove} />
      ) : (
        <div className="flex-1 rounded-2xl bg-[#0d1220] border border-white/5" />
      )}
    </div>
  );
}
