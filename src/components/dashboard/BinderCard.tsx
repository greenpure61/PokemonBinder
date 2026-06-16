"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { BinderWithPages } from "@/types/binder";

const LAYOUT_LABELS = {
  FOUR_POCKET: "4-pocket",
  NINE_POCKET: "9-pocket",
  TWELVE_POCKET: "12-pocket",
} as const;

function CardPreview({ binder }: { binder: BinderWithPages & { _count?: { pages: number } } }) {
  const cols = binder.pocketLayout === "FOUR_POCKET" ? 2 : binder.pocketLayout === "NINE_POCKET" ? 3 : 4;
  const rows = binder.pocketLayout === "TWELVE_POCKET" ? 3 : cols;
  const count = cols * rows;
  const slots = binder.pages[0]?.slots ?? [];

  return (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => {
        const slot = slots.find((s) => s.slotIndex === i);
        if (slot?.cardImageSmall) {
          return (
            <div key={i} className="relative aspect-[2.5/3.5] rounded-sm overflow-hidden">
              <Image
                src={slot.cardImageSmall}
                alt={slot.cardName ?? ""}
                fill
                sizes="50px"
                className="object-cover"
              />
            </div>
          );
        }
        return <div key={i} className="aspect-[2.5/3.5] rounded-sm bg-white/20 opacity-40" />;
      })}
    </div>
  );
}

interface BinderCardProps {
  binder: BinderWithPages & { _count?: { pages: number } };
  onDelete: (id: string) => void;
}

export function BinderCard({ binder, onDelete }: BinderCardProps) {
  const router = useRouter();

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 shadow-xl"
      style={{ background: binder.coverColor }}
      onClick={() => router.push(`/binder/${binder.id}`)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

      <div className="relative p-5">
        <div className="mb-4">
          <CardPreview binder={binder} />
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="font-semibold text-white truncate max-w-[140px]">{binder.name}</p>
            <p className="text-xs text-white/50 mt-0.5">
              {LAYOUT_LABELS[binder.pocketLayout]} · {binder.pageCount} pages
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(binder.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 hover:bg-black/20 text-white/60 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
