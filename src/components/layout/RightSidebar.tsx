"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import { useBinderStore } from "@/store/binderStore";
import { getSlotsPerPage } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

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
  const clearAllSlots = useBinderStore((s) => s.clearAllSlots);
  const { toast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!binder) return null;

  const totalSpreads = Math.ceil(binder.pageCount / 2);
  const leftPageNum = currentSpreadIndex * 2 + 1;
  const rightPageNum = currentSpreadIndex * 2 + 2;
  const slotsPerPage = getSlotsPerPage(binder.pocketLayout);

  const leftPage = binder.pages[currentSpreadIndex * 2];
  const rightPage = binder.pages[currentSpreadIndex * 2 + 1];
  const filledSlots = [...(leftPage?.slots ?? []), ...(rightPage?.slots ?? [])].filter((s) => s.cardId).length;

  // Overall fill across all pages
  const totalFilled = binder.pages.flatMap((p) => p.slots).filter((s) => s.cardId).length;
  const totalSlots = binder.pageCount * slotsPerPage;
  const fillPct = totalSlots > 0 ? Math.round((totalFilled / totalSlots) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 overflow-y-auto p-4 text-sm">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-subtle">Binder</p>
        <p className="truncate text-sm font-semibold text-foreground">{binder.name}</p>
        <p className="mt-0.5 text-xs text-muted">{LAYOUT_LABELS[binder.pocketLayout]}</p>
      </div>

      {/* Overall fill bar */}
      <div>
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-muted">Collection</span>
          <span className="font-medium text-foreground tabular-nums">
            {totalFilled} / {totalSlots}
          </span>
        </div>
        <Progress value={fillPct} />
        <p className="mt-1 text-right text-xs text-subtle">{fillPct}% full</p>
      </div>

      <div className="h-px bg-border" />

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">Pages</p>
        <div className="mb-3 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => goToSpread(currentSpreadIndex - 1)}
            disabled={currentSpreadIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => goToSpread(currentSpreadIndex + 1)}
            disabled={currentSpreadIndex >= totalSpreads - 1}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1.5 rounded-xl border border-border bg-surface-muted p-3">
          <Row label="Left page" value={String(leftPageNum)} />
          <Row label="Right page" value={rightPageNum <= binder.pageCount ? String(rightPageNum) : "—"} />
          <Row label="Spread" value={`${currentSpreadIndex + 1} / ${totalSpreads}`} />
          <Row label="Filled" value={`${filledSlots} / ${slotsPerPage * 2}`} />
        </div>
      </div>

      {/* Jump to spread */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">Jump to spread</p>
        <Input
          type="number"
          min={1}
          max={totalSpreads}
          value={currentSpreadIndex + 1}
          onChange={(e) => goToSpread(Number(e.target.value) - 1)}
        />
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-2 border-t border-border pt-4">
        {onExport && (
          <Button variant="secondary" className="w-full" onClick={onExport}>
            <Download className="h-4 w-4" />
            Export as PNG
          </Button>
        )}
        <Button
          variant="danger"
          className="w-full"
          onClick={() => setConfirmClear(true)}
          disabled={totalFilled === 0}
        >
          <Trash2 className="h-4 w-4" />
          Remove all cards
        </Button>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAllSlots();
          setConfirmClear(false);
          toast("Removed all cards from this binder", "success");
        }}
        title="Remove all cards?"
        description={`This empties every slot in "${binder.name}" (${totalFilled} card${totalFilled === 1 ? "" : "s"}). The binder and its pages are kept. This can't be undone.`}
        confirmLabel="Remove all cards"
        destructive
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}
