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
import { useUIStore } from "@/store/uiStore";
import { useBinderPersist } from "@/hooks/useBinderPersist";
import { useBinder } from "@/hooks/useBinderData";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { EditorLayout } from "@/components/layout/EditorLayout";
import { TopNav } from "@/components/layout/TopNav";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { CardSearchPanel } from "@/components/cards/CardSearchPanel";
import { BinderPageFlat } from "@/components/binder/BinderPageFlat";
import { CardZoomModal } from "@/components/cards/CardZoomModal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { hapticImpact } from "@/lib/haptics";
import type { DragItem } from "@/types/dnd";

interface Props {
  binderId: string;
}

export function BinderEditor({ binderId }: Props) {
  const { data: binderData, isLoading } = useBinder(binderId);
  const setBinder = useBinderStore((s) => s.setBinder);
  const binder = useBinderStore((s) => s.binder);
  const storeBinderId = useBinderStore((s) => s.binder?.id);
  const isDirty = useBinderStore((s) => s.isDirty);
  const isSaving = useBinderStore((s) => s.isSaving);
  const currentSpreadIndex = useBinderStore((s) => s.currentSpreadIndex);
  const currentPageIndex = useBinderStore((s) => s.currentPageIndex);
  const goToSpread = useBinderStore((s) => s.goToSpread);
  const goToPage = useBinderStore((s) => s.goToPage);
  const updateSlot = useBinderStore((s) => s.updateSlot);
  const swapSlots = useBinderStore((s) => s.swapSlots);
  const armedCard = useBinderStore((s) => s.armedCard);
  const armCard = useBinderStore((s) => s.armCard);

  const [activeDrag, setActiveDrag] = useState<DragItem | null>(null);
  const [zoomCard, setZoomCard] = useState<{ cardId: string; cardName: string; cardImageSmall: string } | null>(null);
  const flatRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  async function handleExport() {
    if (!flatRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(flatRef.current, {
      useCORS: true,
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `${binder?.name ?? "binder"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  useBinderPersist();

  // Only hydrate the editor store from server data when loading a *different*
  // binder (or the first load). Returning to the same binder keeps the in-memory
  // working copy, so edits aren't clobbered by a still-cached pre-edit copy.
  useEffect(() => {
    if (binderData && binderData.id !== storeBinderId) setBinder(binderData);
  }, [binderData, storeBinderId, setBinder]);

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

  // Arming a card to place should reveal the binder: close the search drawer on
  // mobile (where it's a full-screen overlay). On desktop the panel is a fixed sidebar.
  useEffect(() => {
    if (armedCard && !isDesktop) {
      const ui = useUIStore.getState();
      if (ui.leftSidebarOpen) ui.toggleLeftSidebar();
    }
  }, [armedCard, isDesktop]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  function onDragStart(event: DragStartEvent) {
    setActiveDrag(event.active.data.current as DragItem);
    hapticImpact(); // confirm the grab on touch
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

  // Tap-to-place (touch): drop the armed search card into a tapped empty slot.
  function handlePlace(pageId: string, slotIndex: number) {
    if (!armedCard) return;
    updateSlot(pageId, slotIndex, armedCard);
    armCard(null);
    hapticImpact(); // tactile confirmation the card dropped in
  }

  if (isLoading || !binder) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const leftPage = binder.pages[currentSpreadIndex * 2];
  const rightPage = binder.pages[currentSpreadIndex * 2 + 1];
  const currentPage = binder.pages[currentPageIndex];

  // Desktop shows the two-page spread and navigates spread-by-spread; phones show
  // one page at a time (the spread is too wide to be usable) and navigate by page.
  const navTotal = isDesktop ? Math.ceil(binder.pageCount / 2) : binder.pageCount;
  const navCurrent = isDesktop ? currentSpreadIndex : currentPageIndex;
  const navGo = isDesktop ? goToSpread : goToPage;

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <EditorLayout
        topNav={<TopNav binder={binder} isDirty={isDirty} isSaving={isSaving} />}
        leftSidebar={<CardSearchPanel />}
        rightSidebar={<RightSidebar onExport={handleExport} />}
      >
        <div className="flex flex-col w-full flex-1 min-h-0 gap-3">
          {armedCard && (
            <div className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-primary/30 bg-primary-soft px-3 py-2">
              <div className="relative h-9 w-7 flex-shrink-0 overflow-hidden rounded bg-surface-muted">
                {armedCard.cardImageSmall ? (
                  <Image src={armedCard.cardImageSmall} alt="" fill sizes="28px" className="object-cover" />
                ) : null}
              </div>
              <p className="min-w-0 flex-1 truncate text-xs text-foreground">
                Placing <span className="font-semibold">{armedCard.cardName}</span> — tap an empty slot
              </p>
              <button
                onClick={() => armCard(null)}
                className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                Cancel
              </button>
            </div>
          )}
          <div ref={flatRef} className="flex-1 min-h-0 flex">
            {isDesktop ? (
              <BinderPageFlat
                leftPage={leftPage}
                rightPage={rightPage}
                layout={binder.pocketLayout}
                spreadIndex={currentSpreadIndex}
                pageCount={binder.pageCount}
                armed={!!armedCard}
                onPlace={handlePlace}
                onZoom={(cardId, cardName, cardImageSmall) => setZoomCard({ cardId, cardName, cardImageSmall })}
                onRemove={(pageId, slotIndex) => updateSlot(pageId, slotIndex, null)}
              />
            ) : (
              <BinderPageFlat
                single
                leftPage={currentPage}
                rightPage={undefined}
                layout={binder.pocketLayout}
                pageNumber={currentPageIndex + 1}
                armed={!!armedCard}
                onPlace={handlePlace}
                onZoom={(cardId, cardName, cardImageSmall) => setZoomCard({ cardId, cardName, cardImageSmall })}
                onRemove={(pageId, slotIndex) => updateSlot(pageId, slotIndex, null)}
              />
            )}
          </div>

          {/* Bottom navigation — spread-by-spread on desktop, page-by-page on mobile */}
          <div className="flex flex-shrink-0 items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navGo(navCurrent - 1)}
              disabled={navCurrent === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <SpreadJump current={navCurrent} total={navTotal} onJump={navGo} label={isDesktop ? "Spread" : "Page"} />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navGo(navCurrent + 1)}
              disabled={navCurrent >= navTotal - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
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

function SpreadJump({ current, total, onJump, label = "Spread" }: { current: number; total: number; onJump: (i: number) => void; label?: string }) {
  const [value, setValue] = useState(String(current + 1));
  const [editing, setEditing] = useState(false);
  const [trackedCurrent, setTrackedCurrent] = useState(current);

  // Keep the input in sync with external spread changes (prev/next, arrow keys)
  // during render, rather than via a prop-syncing effect.
  if (current !== trackedCurrent) {
    setTrackedCurrent(current);
    if (!editing) setValue(String(current + 1));
  }

  function commit() {
    setEditing(false);
    const n = parseInt(value, 10);
    if (!Number.isNaN(n)) onJump(Math.max(0, Math.min(n - 1, total - 1)));
    else setValue(String(current + 1));
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted tabular-nums">
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
        onFocus={(e) => { setEditing(true); e.target.select(); }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") { setValue(String(current + 1)); e.currentTarget.blur(); }
        }}
        aria-label={`Jump to ${label.toLowerCase()}`}
        className="w-11 rounded-md border border-border bg-surface px-1 py-1 text-center text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      />
      <span>/ {total}</span>
    </span>
  );
}
