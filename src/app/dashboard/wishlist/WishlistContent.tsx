"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Check, X } from "lucide-react";
import { CardZoomModal } from "@/components/cards/CardZoomModal";
import { AppHeader } from "@/components/layout/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface WishlistItem {
  id: string;
  cardId: string;
  cardName: string;
  cardImageSmall: string | null;
  cardSet: string | null;
  createdAt: string;
}

type SortMode = "recent" | "name" | "set";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "name", label: "Name" },
  { value: "set", label: "By set" },
];

export function WishlistContent() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("recent");
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState<{ cardId: string; cardName: string; cardImageSmall: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));

    fetch("/api/binders/cards")
      .then((r) => (r.ok ? r.json() : { cardIds: [] }))
      .then((data) => setOwnedIds(new Set(data.cardIds ?? [])))
      .catch(() => null);
  }, []);

  async function removeItem(cardId: string) {
    await fetch(`/api/wishlist/${encodeURIComponent(cardId)}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.cardId !== cardId));
    toast("Removed from wishlist", "success");
  }

  const sortedItems = useMemo(() => {
    const copy = [...items];
    if (sort === "name") {
      copy.sort((a, b) => a.cardName.localeCompare(b.cardName));
    } else if (sort === "set") {
      copy.sort(
        (a, b) => (a.cardSet ?? "").localeCompare(b.cardSet ?? "") || a.cardName.localeCompare(b.cardName)
      );
    }
    // "recent" keeps the API order (createdAt desc)
    return copy;
  }, [items, sort]);

  // Group into sections when sorting by set
  const groups = useMemo(() => {
    if (sort !== "set") return null;
    const map = new Map<string, WishlistItem[]>();
    for (const item of sortedItems) {
      const key = item.cardSet ?? "Unknown set";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [sortedItems, sort]);

  const ownedCount = useMemo(() => items.filter((i) => ownedIds.has(i.cardId)).length, [items, ownedIds]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Wishlist</h1>
            <p className="mt-1 text-sm text-muted">
              {items.length} card{items.length !== 1 ? "s" : ""}
              {ownedCount > 0 && <span className="text-success"> · {ownedCount} already owned</span>}
            </p>
          </div>

          {!loading && items.length > 0 && (
            <div className="flex items-center gap-1 rounded-lg bg-surface-muted p-0.5">
              {SORT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSort(value)}
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    sort === value ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2.5/3.5] rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Star className="h-7 w-7" />}
            title="Your wishlist is empty"
            description="Open any card and use “Add to wishlist”, or right-click a card in your binder to save it here."
          />
        ) : groups ? (
          <div className="space-y-8">
            {groups.map(([setName, setItems]) => (
              <div key={setName}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">
                  {setName} <span className="text-border-strong">· {setItems.length}</span>
                </h2>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
                  {setItems.map((item) => (
                    <WishlistCard
                      key={item.cardId}
                      item={item}
                      owned={ownedIds.has(item.cardId)}
                      onRemove={removeItem}
                      onZoom={setZoom}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          >
            <AnimatePresence>
              {sortedItems.map((item) => (
                <WishlistCard
                  key={item.cardId}
                  item={item}
                  owned={ownedIds.has(item.cardId)}
                  onRemove={removeItem}
                  onZoom={setZoom}
                  animated
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <CardZoomModal
        cardId={zoom?.cardId ?? null}
        cardName={zoom?.cardName ?? ""}
        cardImageSmall={zoom?.cardImageSmall ?? ""}
        onClose={() => setZoom(null)}
      />
    </div>
  );
}

interface CardProps {
  item: WishlistItem;
  owned: boolean;
  onRemove: (cardId: string) => void;
  onZoom: (z: { cardId: string; cardName: string; cardImageSmall: string }) => void;
  animated?: boolean;
}

function WishlistCard({ item, owned, onRemove, onZoom, animated }: CardProps) {
  function handleZoom() {
    onZoom({ cardId: item.cardId, cardName: item.cardName, cardImageSmall: item.cardImageSmall ?? "" });
  }

  const inner = (
    <>
      {item.cardImageSmall ? (
        <Image src={item.cardImageSmall} alt={item.cardName} fill sizes="120px" className="rounded-xl object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-xl bg-surface-muted p-2 text-center text-xs text-muted">
          {item.cardName}
        </div>
      )}

      {/* Owned badge */}
      {owned && (
        <div className="absolute left-1 top-1 z-10 flex items-center gap-0.5 rounded-full bg-success px-1.5 py-0.5 shadow-md">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          <span className="pr-0.5 text-[8px] font-semibold text-white">Owned</span>
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.cardId);
        }}
        className="absolute right-1 top-1 z-10 rounded-full bg-white/90 p-1 text-slate-600 opacity-0 shadow-md transition-opacity hover:bg-white hover:text-danger group-hover:opacity-100"
        aria-label="Remove from wishlist"
      >
        <X className="h-3 w-3" strokeWidth={2.5} />
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-xs font-medium text-white">{item.cardName}</p>
        {item.cardSet && <p className="truncate text-xs text-white/60">{item.cardSet}</p>}
      </div>
    </>
  );

  if (animated) {
    return (
      <motion.div
        layout
        variants={{
          hidden: { opacity: 0, scale: 0.9 },
          show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 28 } },
        }}
        exit={{ opacity: 0, scale: 0.85 }}
        onClick={handleZoom}
        className="group relative aspect-[2.5/3.5] cursor-pointer"
      >
        {inner}
      </motion.div>
    );
  }

  return (
    <div onClick={handleZoom} className="group relative aspect-[2.5/3.5] cursor-pointer">
      {inner}
    </div>
  );
}
