"use client";

import { useBinderStore } from "@/store/binderStore";
import { getSlotsPerPage } from "@/lib/utils";

const LAYOUT_LABELS = {
  FOUR_POCKET: "4-pocket",
  NINE_POCKET: "9-pocket",
  TWELVE_POCKET: "12-pocket",
} as const;

interface Props {
  onExport?: () => void;
}

export function RightSidebar({ onExport }: Props) {
  const binder = useBinderStore((s) => s.binder);
  const currentSpreadIndex = useBinderStore((s) => s.currentSpreadIndex);
  const goToSpread = useBinderStore((s) => s.goToSpread);

  if (!binder) return null;

  const totalSpreads = Math.ceil(binder.pageCount / 2);
  const leftPageNum = currentSpreadIndex * 2 + 1;
  const rightPageNum = currentSpreadIndex * 2 + 2;
  const slotsPerPage = getSlotsPerPage(binder.pocketLayout);

  const leftPage = binder.pages[currentSpreadIndex * 2];
  const rightPage = binder.pages[currentSpreadIndex * 2 + 1];
  const filledSlots = [
    ...(leftPage?.slots ?? []),
    ...(rightPage?.slots ?? []),
  ].filter((s) => s.cardId).length;

  // Overall fill across all pages
  const totalFilled = binder.pages
    .flatMap((p) => p.slots)
    .filter((s) => s.cardId).length;
  const totalSlots = binder.pageCount * slotsPerPage;
  const fillPct = totalSlots > 0 ? Math.round((totalFilled / totalSlots) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 p-4 text-sm overflow-y-auto">
      <div>
        <p className="text-xs text-white/30 mb-1">Binder</p>
        <p className="text-white/80 font-medium text-sm truncate">{binder.name}</p>
        <p className="text-xs text-white/30 mt-0.5">{LAYOUT_LABELS[binder.pocketLayout]}</p>
      </div>

      {/* Overall fill bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-white/30">Collection</span>
          <span className="text-white/50">{totalFilled} / {totalSlots}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <p className="text-xs text-white/20 mt-1 text-right">{fillPct}% full</p>
      </div>

      <div className="w-full h-px bg-white/5" />

      <div>
        <p className="text-xs text-white/30 mb-3">Pages</p>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => goToSpread(currentSpreadIndex - 1)}
            disabled={currentSpreadIndex === 0}
            className="flex-1 rounded-lg border border-white/10 py-2 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
          >
            ← Prev
          </button>
          <button
            onClick={() => goToSpread(currentSpreadIndex + 1)}
            disabled={currentSpreadIndex >= totalSpreads - 1}
            className="flex-1 rounded-lg border border-white/10 py-2 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
          >
            Next →
          </button>
        </div>

        <div className="glass rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-white/30">Left page</span>
            <span className="text-white/60">{leftPageNum}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/30">Right page</span>
            <span className="text-white/60">{rightPageNum <= binder.pageCount ? rightPageNum : "—"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/30">Spread</span>
            <span className="text-white/60">{currentSpreadIndex + 1} / {totalSpreads}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/30">Filled</span>
            <span className="text-white/60">{filledSlots} / {slotsPerPage * 2}</span>
          </div>
        </div>
      </div>

      {/* Jump to spread */}
      <div>
        <p className="text-xs text-white/30 mb-2">Jump to spread</p>
        <input
          type="number"
          min={1}
          max={totalSpreads}
          value={currentSpreadIndex + 1}
          onChange={(e) => goToSpread(Number(e.target.value) - 1)}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-white/25"
        />
      </div>

      {/* Export */}
      {onExport && (
        <div className="mt-auto pt-2 border-t border-white/5">
          <button
            onClick={onExport}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-xs text-white/50 hover:text-white hover:border-white/25 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export as PNG
          </button>
        </div>
      )}
    </div>
  );
}
