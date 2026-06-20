"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Trash2, Layers } from "lucide-react";
import type { BinderListItem } from "@/hooks/useBinderData";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

const LAYOUT_LABELS = {
  FOUR_POCKET: "4-pocket",
  NINE_POCKET: "9-pocket",
  TWELVE_POCKET: "12-pocket",
} as const;

function CardPreview({ binder }: { binder: BinderListItem }) {
  const cols = binder.pocketLayout === "FOUR_POCKET" ? 2 : binder.pocketLayout === "NINE_POCKET" ? 3 : 4;
  const rows = binder.pocketLayout === "TWELVE_POCKET" ? 3 : cols;
  const count = cols * rows;
  const slots = binder.pages[0]?.slots ?? [];

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => {
        const slot = slots.find((s) => s.slotIndex === i);
        if (slot?.cardImageSmall) {
          return (
            <div key={i} className="relative aspect-[2.5/3.5] overflow-hidden rounded-sm shadow-sm">
              <Image src={slot.cardImageSmall} alt={slot.cardName ?? ""} fill sizes="60px" className="object-cover" />
            </div>
          );
        }
        return <div key={i} className="aspect-[2.5/3.5] rounded-sm bg-white/15" />;
      })}
    </div>
  );
}

interface BinderCardProps {
  binder: BinderListItem;
  onDelete: (binder: BinderListItem) => void;
  onEdit: (binder: BinderListItem) => void;
}

export function BinderCard({ binder, onDelete, onEdit }: BinderCardProps) {
  const router = useRouter();
  const cardCount = binder.cardCount ?? 0;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="group h-full">
      <Card
        onClick={() => router.push(`/binder/${binder.id}`)}
        className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-md"
      >
        {/* Cover */}
        <div className="relative p-4" style={{ background: binder.coverColor }}>
          <span className="absolute right-3 top-3 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm">
            {cardCount} {cardCount === 1 ? "card" : "cards"}
          </span>
          <CardPreview binder={binder} />
        </div>

        {/* Info */}
        <div className="flex items-center justify-between gap-2 p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{binder.name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              <Layers className="h-3.5 w-3.5" />
              {LAYOUT_LABELS[binder.pocketLayout]} · {binder.pageCount} pages
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <IconButton
              aria-label="Edit binder"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(binder);
              }}
            >
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton
              aria-label="Delete binder"
              size="sm"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(binder);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
