"use client";

import { CardSlotFlat } from "./CardSlotFlat";
import type { BinderPageWithSlots } from "@/types/binder";
import { getSlotsPerPage, getGridCols, getGridRows } from "@/lib/utils";
import type { BinderLayout } from "@prisma/client";

interface PageProps {
  page: BinderPageWithSlots;
  layout: BinderLayout;
  pageNumber?: number;
  onZoom: (cardId: string, cardName: string, cardImageSmall: string) => void;
  onRemove: (pageId: string, slotIndex: number) => void;
}

function SinglePage({ page, layout, pageNumber, onZoom, onRemove }: PageProps) {
  const slotCount = getSlotsPerPage(layout);
  const cols = getGridCols(layout);
  const rows = getGridRows(layout);

  return (
    <div className="flex-1 flex flex-col bg-[#12182b] rounded-2xl border border-white/5 shadow-xl min-w-0 min-h-0 overflow-hidden">
      <div
        className="flex-1 grid gap-2 p-3 min-h-0"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
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
      {pageNumber != null && (
        <p className="text-center text-[10px] text-white/20 py-1.5 flex-shrink-0 tabular-nums select-none">
          {pageNumber}
        </p>
      )}
    </div>
  );
}

interface SpreadProps {
  leftPage: BinderPageWithSlots | undefined;
  rightPage: BinderPageWithSlots | undefined;
  layout: BinderLayout;
  spreadIndex?: number;
  pageCount?: number;
  onZoom: (cardId: string, cardName: string, cardImageSmall: string) => void;
  onRemove: (pageId: string, slotIndex: number) => void;
}

export function BinderPageFlat({ leftPage, rightPage, layout, spreadIndex, pageCount, onZoom, onRemove }: SpreadProps) {
  const leftNum = spreadIndex != null ? spreadIndex * 2 + 1 : undefined;
  const rightNum = spreadIndex != null ? spreadIndex * 2 + 2 : undefined;
  const rightVisible = pageCount == null || rightNum == null || rightNum <= pageCount;

  const cols = getGridCols(layout);
  const rows = getGridRows(layout);
  // Derive width from height so cards always fit vertically without overflow.
  // Two portrait pages side-by-side: spread AR = (2 × cols) / (rows × card_AR)
  const spreadAR = (2 * cols) / (rows * 1.4);

  return (
    // Centering wrapper — fills the flex parent, centers the constrained spread
    <div className="flex-1 min-h-0 flex justify-center">
      {/* Spread — height fills container, width derived from aspect ratio */}
      <div
        className="h-full min-h-0 max-w-full flex gap-2"
        style={{ aspectRatio: String(spreadAR) }}
      >
        {leftPage ? (
          <SinglePage
            page={leftPage}
            layout={layout}
            pageNumber={leftNum}
            onZoom={onZoom}
            onRemove={onRemove}
          />
        ) : (
          <div className="flex-1 rounded-2xl bg-[#0d1220] border border-white/5" />
        )}

        {/* Spine divider */}
        <div className="w-3 flex-shrink-0 flex items-stretch justify-center py-6">
          <div className="w-px bg-white/5 rounded-full" />
        </div>

        {rightPage && rightVisible ? (
          <SinglePage
            page={rightPage}
            layout={layout}
            pageNumber={rightVisible ? rightNum : undefined}
            onZoom={onZoom}
            onRemove={onRemove}
          />
        ) : (
          <div className="flex-1 rounded-2xl bg-[#0d1220] border border-white/5" />
        )}
      </div>
    </div>
  );
}
