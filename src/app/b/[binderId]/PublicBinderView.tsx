"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useBinderStore } from "@/store/binderStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { BinderPageFlat } from "@/components/binder/BinderPageFlat";
import { CardZoomModal } from "@/components/cards/CardZoomModal";
import { Logo } from "@/components/layout/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { BinderWithPages } from "@/types/binder";

interface Props {
  binder: BinderWithPages;
}

export function PublicBinderView({ binder }: Props) {
  const setBinder = useBinderStore((s) => s.setBinder);
  const goToSpread = useBinderStore((s) => s.goToSpread);
  const goToPage = useBinderStore((s) => s.goToPage);
  const currentSpreadIndex = useBinderStore((s) => s.currentSpreadIndex);
  const currentPageIndex = useBinderStore((s) => s.currentPageIndex);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [zoomCard, setZoomCard] = useState<{ cardId: string; cardName: string; cardImageSmall: string } | null>(null);

  useEffect(() => {
    setBinder(binder);
  }, [binder, setBinder]);

  const leftPage = binder.pages[currentSpreadIndex * 2];
  const rightPage = binder.pages[currentSpreadIndex * 2 + 1];
  const currentPage = binder.pages[currentPageIndex];

  // Desktop shows the two-page spread and navigates spread-by-spread; phones show
  // one page at a time (the spread overflows the viewport — clipping the page off
  // the right and pushing the fixed zoom modal off-screen) and navigate by page.
  const navTotal = isDesktop ? Math.ceil(binder.pageCount / 2) : binder.pageCount;
  const navCurrent = isDesktop ? currentSpreadIndex : currentPageIndex;
  const navGo = isDesktop ? goToSpread : goToPage;

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="hidden text-sm font-extrabold tracking-tight text-foreground sm:inline">
              Pokémon<span className="text-primary">Binder</span>
            </span>
          </Link>
          <div className="h-4 w-px flex-shrink-0 bg-border" />
          <span className="truncate text-sm font-semibold text-foreground">{binder.name}</span>
          <Badge variant="primary" className="flex-shrink-0">
            Public
          </Badge>
        </div>
        <Link
          href="/login"
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          Create your own
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="flex min-h-0 flex-1 p-4">
        {isDesktop ? (
          <BinderPageFlat
            leftPage={leftPage}
            rightPage={rightPage}
            layout={binder.pocketLayout}
            spreadIndex={currentSpreadIndex}
            pageCount={binder.pageCount}
            editable={false}
            onZoom={(cardId, cardName, cardImageSmall) => setZoomCard({ cardId, cardName, cardImageSmall })}
            onRemove={() => {}}
          />
        ) : (
          <BinderPageFlat
            single
            leftPage={currentPage}
            rightPage={undefined}
            layout={binder.pocketLayout}
            pageNumber={currentPageIndex + 1}
            editable={false}
            onZoom={(cardId, cardName, cardImageSmall) => setZoomCard({ cardId, cardName, cardImageSmall })}
            onRemove={() => {}}
          />
        )}
      </div>

      <div className="flex flex-shrink-0 items-center justify-center gap-4 border-t border-border bg-surface py-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navGo(navCurrent - 1)}
          disabled={navCurrent === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <span className="text-xs text-muted tabular-nums">
          {navCurrent + 1} / {navTotal}
        </span>
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

      <CardZoomModal
        cardId={zoomCard?.cardId ?? null}
        cardName={zoomCard?.cardName ?? ""}
        cardImageSmall={zoomCard?.cardImageSmall ?? ""}
        onClose={() => setZoomCard(null)}
      />
    </div>
  );
}
