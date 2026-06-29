"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, Layers } from "lucide-react";
import type { BinderLayout } from "@prisma/client";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getGridCols, getSlotsPerPage } from "@/lib/utils";

interface FeedSlot {
  slotIndex: number;
  cardImageSmall: string | null;
  cardName: string | null;
}

interface FeedBinder {
  id: string;
  name: string;
  coverColor: string;
  pocketLayout: BinderLayout;
  pageCount: number;
  owner: { name: string | null; image: string | null };
  previewSlots: FeedSlot[];
}

const LAYOUT_LABELS: Record<BinderLayout, string> = {
  FOUR_POCKET: "4-pocket",
  NINE_POCKET: "9-pocket",
  TWELVE_POCKET: "12-pocket",
};

export function ExploreContent() {
  const [binders, setBinders] = useState<FeedBinder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/explore")
      .then((r) => (r.ok ? r.json() : []))
      .then(setBinders)
      .catch(() => setBinders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-lg px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Explore</h1>
          <p className="mt-1 text-sm text-muted">
            Public binders from the community — tap any to take a closer look.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-2xl" />
            ))}
          </div>
        ) : binders.length === 0 ? (
          <EmptyState
            icon={<Compass className="h-8 w-8" />}
            title="Nothing to explore yet"
            description="No public binders out there yet. Make one of yours public with the Share button and it'll show up here."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {binders.map((binder) => (
              <FeedItem key={binder.id} binder={binder} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FeedItem({ binder }: { binder: FeedBinder }) {
  const router = useRouter();
  const cols = getGridCols(binder.pocketLayout);
  const count = getSlotsPerPage(binder.pocketLayout);

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
      <Card
        onClick={() => router.push(`/b/${binder.id}`)}
        className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      >
        {/* Owner header */}
        <div className="flex items-center gap-2.5 px-4 py-3">
          {binder.owner.image ? (
            <Image src={binder.owner.image} alt="" width={32} height={32} className="rounded-full" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
              {(binder.owner.name ?? "?")[0]?.toUpperCase()}
            </span>
          )}
          <span className="min-w-0 truncate text-sm font-semibold text-foreground">
            {binder.owner.name ?? "Trainer"}
          </span>
        </div>

        {/* First-page preview */}
        <div className="p-4" style={{ background: binder.coverColor }}>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: count }).map((_, i) => {
              const slot = binder.previewSlots.find((s) => s.slotIndex === i);
              return slot?.cardImageSmall ? (
                <div key={i} className="relative aspect-[2.5/3.5] overflow-hidden rounded shadow-sm">
                  <Image
                    src={slot.cardImageSmall}
                    alt={slot.cardName ?? ""}
                    fill
                    sizes="140px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div key={i} className="aspect-[2.5/3.5] rounded bg-white/15" />
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3">
          <p className="truncate font-semibold text-foreground">{binder.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            <Layers className="h-3.5 w-3.5" />
            {LAYOUT_LABELS[binder.pocketLayout]} · {binder.pageCount} pages
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
