"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Star, Eye, Trash2 } from "lucide-react";
import type { CardSlot } from "@prisma/client";
import type { DragItem } from "@/types/dnd";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { CardImage } from "@/components/cards/CardImage";

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
  const { toast } = useToast();

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
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
    (node: HTMLDivElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
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
    if (res.status === 201) toast("Added to wishlist", "success");
    else toast("Already in your wishlist", "info");
  }

  return (
    <>
      <div
        ref={mergedRef}
        onContextMenu={handleContextMenu}
        className={cn(
          "group relative h-full w-full rounded-lg transition-all duration-150",
          isOver && "scale-[1.03] ring-2 ring-primary",
          isDragging && "opacity-30"
        )}
      >
        {hasCard ? (
          <div
            {...listeners}
            {...attributes}
            className="relative h-full w-full cursor-grab active:cursor-grabbing"
            onClick={() => onZoom(slot!.cardId!, slot!.cardName ?? "", slot!.cardImageSmall ?? "")}
          >
            <CardImage
              src={slot!.cardImageSmall ?? ""}
              alt={slot!.cardName ?? "Card"}
              name={slot!.cardName ?? "Card"}
              sizes="120px"
              className="select-none rounded-lg object-contain"
              placeholderClassName="rounded-lg bg-surface-muted"
              draggable={false}
              priority={priority}
            />
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(pageId, slotIndex);
              }}
              className="absolute right-1 top-1 z-10 rounded-full bg-white/90 p-1 text-slate-600 opacity-0 shadow-md transition-opacity hover:bg-white hover:text-danger group-hover:opacity-100"
              aria-label="Remove card"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed transition-colors",
              isOver ? "border-primary bg-primary-soft" : "border-border"
            )}
          >
            <Plus className="h-5 w-5 select-none text-subtle" />
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
            className="fixed z-[100] min-w-[170px] rounded-xl border border-border bg-surface p-1 shadow-lg"
            style={{ left: menu.x, top: menu.y }}
          >
            <button
              onClick={addToWishlist}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground transition-colors hover:bg-surface-muted"
            >
              <Star className="h-3.5 w-3.5 text-accent" />
              Add to wishlist
            </button>
            <button
              onClick={() => {
                onZoom(slot!.cardId!, slot!.cardName ?? "", slot!.cardImageSmall ?? "");
                setMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground transition-colors hover:bg-surface-muted"
            >
              <Eye className="h-3.5 w-3.5 text-muted" />
              View card
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={() => {
                onRemove(pageId, slotIndex);
                setMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-danger transition-colors hover:bg-danger-soft"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove card
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
