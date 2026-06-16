"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { CardSlot } from "@prisma/client";
import type { DragItem } from "@/types/dnd";

interface Props {
  pageId: string;
  slotIndex: number;
  slot: CardSlot | undefined;
  priority?: boolean;
  onZoom: (cardId: string, cardName: string, cardImageSmall: string) => void;
  onRemove: (pageId: string, slotIndex: number) => void;
}

export function CardSlotFlat({ pageId, slotIndex, slot, priority, onZoom, onRemove }: Props) {
  const hasCard = !!slot?.cardId;
  const dropId = `drop-${pageId}-${slotIndex}`;
  const dragId = `slot-${pageId}-${slotIndex}`;

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [wishlistMsg, setWishlistMsg] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const dragData: DragItem = {
    type: "SLOT_CARD",
    cardId: slot?.cardId ?? "",
    cardName: slot?.cardName ?? "",
    cardImageSmall: slot?.cardImageSmall ?? "",
    cardSet: slot?.cardSet ?? "",
    sourceSlotIndex: slotIndex,
    sourcePageId: pageId,
  };

  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({
    id: dragId,
    data: dragData,
    disabled: !hasCard,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    data: { pageId, slotIndex, occupied: hasCard },
  });

  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => { setDragRef(node); setDropRef(node); },
    [setDragRef, setDropRef]
  );

  useEffect(() => {
    if (!menu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menu]);

  function handleContextMenu(e: React.MouseEvent) {
    if (!hasCard) return;
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  }

  async function addToWishlist() {
    setMenu(null);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: slot!.cardId,
        cardName: slot!.cardName,
        cardImageSmall: slot!.cardImageSmall,
        cardSet: slot!.cardSet,
      }),
    });
    setWishlistMsg(res.status === 201 ? "Added!" : "Already in list");
    setTimeout(() => setWishlistMsg(""), 1800);
  }

  return (
    <>
      <div
        ref={mergedRef}
        onContextMenu={handleContextMenu}
        className={`group relative h-full w-full rounded-lg transition-all duration-150 ${
          isOver ? "ring-2 ring-white/60 scale-[1.03]" : ""
        } ${isDragging ? "opacity-30" : ""}`}
      >
        {hasCard ? (
          <div
            {...listeners}
            {...attributes}
            className="relative w-full h-full cursor-grab active:cursor-grabbing"
            onClick={() => onZoom(slot!.cardId!, slot!.cardName ?? "", slot!.cardImageSmall ?? "")}
          >
            <Image
              src={slot!.cardImageSmall!}
              alt={slot!.cardName ?? "Card"}
              fill
              sizes="120px"
              className="rounded-lg object-contain select-none"
              draggable={false}
              priority={priority}
            />
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRemove(pageId, slotIndex); }}
              className="absolute top-1 right-1 z-10 rounded-full bg-black/60 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              aria-label="Remove card"
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <AnimatePresence>
              {wishlistMsg && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/65 text-xs text-white font-medium pointer-events-none"
                >
                  {wishlistMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div
            className={`w-full h-full rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
              isOver ? "border-white/40 bg-white/5" : "border-white/10"
            }`}
          >
            <span className="text-white/20 text-lg select-none">+</span>
          </div>
        )}
      </div>

      {/* Right-click context menu */}
      <AnimatePresence>
        {menu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[100] glass rounded-xl p-1 shadow-2xl min-w-[160px]"
            style={{ left: menu.x, top: menu.y }}
          >
            <button
              onClick={addToWishlist}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Add to Wishlist
            </button>
            <button
              onClick={() => { onZoom(slot!.cardId!, slot!.cardName ?? "", slot!.cardImageSmall ?? ""); setMenu(null); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Card
            </button>
            <div className="w-full h-px bg-white/5 my-1" />
            <button
              onClick={() => { onRemove(pageId, slotIndex); setMenu(null); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400/80 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Remove Card
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
