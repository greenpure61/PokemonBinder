"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBinderStore } from "@/store/binderStore";
import { BinderPageFlat } from "@/components/binder/BinderPageFlat";
import { CardZoomModal } from "@/components/cards/CardZoomModal";
import type { BinderWithPages } from "@/types/binder";

interface Props {
  binder: BinderWithPages;
}

export function PublicBinderView({ binder }: Props) {
  const setBinder = useBinderStore((s) => s.setBinder);
  const goToSpread = useBinderStore((s) => s.goToSpread);
  const currentSpreadIndex = useBinderStore((s) => s.currentSpreadIndex);
  const totalSpreads = Math.ceil(binder.pageCount / 2);

  const [zoomCard, setZoomCard] = useState<{ cardId: string; cardName: string; cardImageSmall: string } | null>(null);

  useEffect(() => {
    setBinder(binder);
  }, [binder, setBinder]);

  const leftPage = binder.pages[currentSpreadIndex * 2];
  const rightPage = binder.pages[currentSpreadIndex * 2 + 1];

  return (
    <div className="flex flex-col h-screen bg-[#0c1020]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/40 hover:text-white transition-colors text-sm font-medium">
            🎴 PokemonBinder
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-sm font-medium text-white">{binder.name}</span>
          <span className="text-xs text-white/40 glass px-2 py-0.5 rounded-full">Public</span>
        </div>
        <Link
          href="/login"
          className="rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-white/90 transition-colors"
        >
          Create your own →
        </Link>
      </header>

      <div className="flex-1 min-h-0 p-4 flex">
        <BinderPageFlat
          leftPage={leftPage}
          rightPage={rightPage}
          layout={binder.pocketLayout}
          spreadIndex={currentSpreadIndex}
          pageCount={binder.pageCount}
          onZoom={(cardId, cardName, cardImageSmall) => setZoomCard({ cardId, cardName, cardImageSmall })}
          onRemove={() => {}}
        />
      </div>

      <div className="flex items-center justify-center gap-4 py-3 border-t border-white/5 flex-shrink-0">
        <button
          onClick={() => goToSpread(currentSpreadIndex - 1)}
          disabled={currentSpreadIndex === 0}
          className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-white/60 hover:text-white hover:border-white/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        <span className="text-xs text-white/40 tabular-nums">
          {currentSpreadIndex + 1} / {totalSpreads}
        </span>
        <button
          onClick={() => goToSpread(currentSpreadIndex + 1)}
          disabled={currentSpreadIndex >= totalSpreads - 1}
          className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-white/60 hover:text-white hover:border-white/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>

      <CardZoomModal
        cardId={zoomCard?.cardId ?? null}
        cardName={zoomCard?.cardName ?? ""}
        cardImageSmall={zoomCard?.cardImageSmall ?? ""}
        onClose={() => setZoomCard(null)}
      />
    </div>
  );
}
