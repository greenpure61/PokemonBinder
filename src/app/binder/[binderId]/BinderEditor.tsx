"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import Image from "next/image";
import { useBinderStore } from "@/store/binderStore";
import { useBinderPersist } from "@/hooks/useBinderPersist";
import { useBinder } from "@/hooks/useBinderData";
import { EditorLayout } from "@/components/layout/EditorLayout";
import { TopNav } from "@/components/layout/TopNav";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { CardSearchPanel } from "@/components/cards/CardSearchPanel";
import { BinderPageFlat } from "@/components/binder/BinderPageFlat";
import { CardZoomModal } from "@/components/cards/CardZoomModal";
import type { DragItem } from "@/types/dnd";

interface Props {
  binderId: string;
}

export function BinderEditor({ binderId }: Props) {
  const { data: binderData, isLoading } = useBinder(binderId);
  const setBinder = useBinderStore((s) => s.setBinder);
  const binder = useBinderStore((s) => s.binder);
  const isDirty = useBinderStore((s) => s.isDirty);
  const isSaving = useBinderStore((s) => s.isSaving);
  const currentSpreadIndex = useBinderStore((s) => s.currentSpreadIndex);
  const goToSpread = useBinderStore((s) => s.goToSpread);
  const updateSlot = useBinderStore((s) => s.updateSlot);
  const swapSlots = useBinderStore((s) => s.swapSlots);

  const [activeDrag, setActiveDrag] = useState<DragItem | null>(null);
  const [zoomCard, setZoomCard] = useState<{ cardId: string; cardName: string; cardImageSmall: string } | null>(null);
  const flatRef = useRef<HTMLDivElement>(null);

  async function handleExport() {
    if (!flatRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(flatRef.current, {
      useCORS: true,
      backgroundColor: "#12182b",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `${binder?.name ?? "binder"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  useBinderPersist();

  useEffect(() => {
    if (binderData) setBinder(binderData);
  }, [binderData, setBinder]);

  useEffect(() => {
    if (!binder) return;
    const totalSpreads = Math.ceil(binder.pageCount / 2);
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") goToSpread(Math.min(currentSpreadIndex + 1, totalSpreads - 1));
      if (e.key === "ArrowLeft") goToSpread(Math.max(currentSpreadIndex - 1, 0));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [binder, currentSpreadIndex, goToSpread]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  function onDragStart(event: DragStartEvent) {
    setActiveDrag(event.active.data.current as DragItem);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over || !binder) return;

    const drag = active.data.current as DragItem;
    const drop = over.data.current as { pageId: string; slotIndex: number; occupied: boolean };
    if (!drop?.pageId) return;

    if (!drop.occupied) {
      // Place into empty slot
      updateSlot(drop.pageId, drop.slotIndex, {
        cardId: drag.cardId,
        cardName: drag.cardName,
        cardImageSmall: drag.cardImageSmall,
        cardSet: drag.cardSet,
      });
      // Clear source slot if moving from another slot
      if (drag.type === "SLOT_CARD" && drag.sourcePageId && drag.sourceSlotIndex !== undefined) {
        updateSlot(drag.sourcePageId, drag.sourceSlotIndex, null);
      }
    } else if (drag.type === "SLOT_CARD" && drag.sourcePageId && drag.sourceSlotIndex !== undefined) {
      // Swap two slot cards
      swapSlots(
        { pageId: drag.sourcePageId, slotIndex: drag.sourceSlotIndex },
        { pageId: drop.pageId, slotIndex: drop.slotIndex }
      );
    } else {
      // Search card dropped onto occupied slot — replace
      updateSlot(drop.pageId, drop.slotIndex, {
        cardId: drag.cardId,
        cardName: drag.cardName,
        cardImageSmall: drag.cardImageSmall,
        cardSet: drag.cardSet,
      });
    }
  }

  if (isLoading || !binder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
      </div>
    );
  }

  const leftPage = binder.pages[currentSpreadIndex * 2];
  const rightPage = binder.pages[currentSpreadIndex * 2 + 1];

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <EditorLayout
        topNav={<TopNav binder={binder} isDirty={isDirty} isSaving={isSaving} />}
        leftSidebar={<CardSearchPanel />}
        rightSidebar={<RightSidebar onExport={handleExport} />}
      >
        <div className="flex flex-col w-full flex-1 min-h-0 gap-3">
          <div ref={flatRef} className="flex-1 min-h-0 flex">
            <BinderPageFlat
              leftPage={leftPage}
              rightPage={rightPage}
              layout={binder.pocketLayout}
              spreadIndex={currentSpreadIndex}
              pageCount={binder.pageCount}
              onZoom={(cardId, cardName, cardImageSmall) => setZoomCard({ cardId, cardName, cardImageSmall })}
              onRemove={(pageId, slotIndex) => updateSlot(pageId, slotIndex, null)}
            />
          </div>

          {/* Bottom navigation */}
          <div className="flex items-center justify-center gap-3 flex-shrink-0">
            <button
              onClick={() => goToSpread(currentSpreadIndex - 1)}
              disabled={currentSpreadIndex === 0}
              className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-white/50 hover:text-white hover:border-white/25 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-white/30 tabular-nums min-w-[80px] text-center">
              Spread {currentSpreadIndex + 1} / {Math.ceil(binder.pageCount / 2)}
            </span>
            <button
              onClick={() => goToSpread(currentSpreadIndex + 1)}
              disabled={currentSpreadIndex >= Math.ceil(binder.pageCount / 2) - 1}
              className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-white/50 hover:text-white hover:border-white/25 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </EditorLayout>

      <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
        {activeDrag?.cardImageSmall ? (
          <div className="relative w-20 aspect-[2.5/3.5] rotate-[-3deg] opacity-90 pointer-events-none">
            <Image
              src={activeDrag.cardImageSmall}
              alt={activeDrag.cardName}
              fill
              sizes="80px"
              className="rounded-lg object-cover shadow-2xl"
            />
          </div>
        ) : null}
      </DragOverlay>

      <CardZoomModal
        cardId={zoomCard?.cardId ?? null}
        cardName={zoomCard?.cardName ?? ""}
        cardImageSmall={zoomCard?.cardImageSmall ?? ""}
        onClose={() => setZoomCard(null)}
      />
    </DndContext>
  );
}
