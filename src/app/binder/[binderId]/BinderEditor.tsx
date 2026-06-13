"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useBinderStore } from "@/store/binderStore";
import { useUIStore } from "@/store/uiStore";
import { useBinderPersist } from "@/hooks/useBinderPersist";
import { useBinder } from "@/hooks/useBinderData";
import { EditorLayout } from "@/components/layout/EditorLayout";
import { TopNav } from "@/components/layout/TopNav";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { CardSearchPanel } from "@/components/cards/CardSearchPanel";
import { BinderPageFlat } from "@/components/binder/BinderPageFlat";
import { BinderCanvas } from "@/components/binder/BinderCanvas";
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
  const updateSlot = useBinderStore((s) => s.updateSlot);
  const swapSlots = useBinderStore((s) => s.swapSlots);

  const viewMode = useUIStore((s) => s.viewMode);

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
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <EditorLayout
        topNav={<TopNav binder={binder} isDirty={isDirty} isSaving={isSaving} />}
        leftSidebar={<CardSearchPanel />}
        rightSidebar={<RightSidebar onExport={viewMode === "flat" ? handleExport : undefined} />}
      >
        <AnimatePresence mode="wait">
          {viewMode === "3d" ? (
            <motion.div
              key="3d"
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <BinderCanvas />
            </motion.div>
          ) : (
            <motion.div
              key="flat"
              ref={flatRef}
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <BinderPageFlat
                leftPage={leftPage}
                rightPage={rightPage}
                layout={binder.pocketLayout}
                onZoom={(cardId, cardName, cardImageSmall) => setZoomCard({ cardId, cardName, cardImageSmall })}
                onRemove={(pageId, slotIndex) => updateSlot(pageId, slotIndex, null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </EditorLayout>

      <DragOverlay dropAnimation={null}>
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
