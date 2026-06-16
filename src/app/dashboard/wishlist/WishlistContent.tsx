"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CardZoomModal } from "@/components/cards/CardZoomModal";

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
  }

  const sortedItems = useMemo(() => {
    const copy = [...items];
    if (sort === "name") {
      copy.sort((a, b) => a.cardName.localeCompare(b.cardName));
    } else if (sort === "set") {
      copy.sort(
        (a, b) =>
          (a.cardSet ?? "").localeCompare(b.cardSet ?? "") ||
          a.cardName.localeCompare(b.cardName)
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

  const ownedCount = useMemo(
    () => items.filter((i) => ownedIds.has(i.cardId)).length,
    [items, ownedIds]
  );

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-semibold text-white">Wishlist</h1>
          <span className="text-xs text-white/30 ml-auto">
            {items.length} card{items.length !== 1 ? "s" : ""}
            {ownedCount > 0 && <span className="text-green-400/70"> · {ownedCount} owned</span>}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Sort control */}
        {!loading && items.length > 0 && (
          <div className="mb-6 flex items-center gap-1">
            <span className="text-[11px] text-white/30 mr-1">Sort</span>
            {SORT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSort(value)}
                className={`rounded-md px-2.5 py-1 text-[11px] border transition-colors ${
                  sort === value
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                    : "bg-white/5 border-transparent text-white/40 hover:text-white/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="aspect-[2.5/3.5] rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h2 className="text-lg font-medium text-white/70">Your wishlist is empty</h2>
            <p className="text-sm text-white/30 mt-1">
              Click any card and use “Add to Wishlist”, or right-click a card in your binder
            </p>
          </div>
        ) : groups ? (
          <div className="space-y-8">
            {groups.map(([setName, setItems]) => (
              <div key={setName}>
                <h2 className="mb-3 text-xs font-semibold text-white/40 uppercase tracking-wider">
                  {setName} <span className="text-white/20">· {setItems.length}</span>
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
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
            className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3"
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
        <Image
          src={item.cardImageSmall}
          alt={item.cardName}
          fill
          sizes="120px"
          className="rounded-xl object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-xl bg-white/5 flex items-center justify-center text-white/20 text-xs text-center p-2">
          {item.cardName}
        </div>
      )}

      {/* Owned badge */}
      {owned && (
        <div className="absolute top-1 left-1 z-10 flex items-center gap-0.5 rounded-full bg-green-500/90 px-1 py-0.5 shadow-md">
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-white text-[8px] font-semibold pr-0.5">Owned</span>
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onRemove(item.cardId); }}
        className="absolute top-1 right-1 z-10 rounded-full bg-black/70 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/80"
        aria-label="Remove from wishlist"
      >
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-white text-xs font-medium truncate">{item.cardName}</p>
        {item.cardSet && <p className="text-white/50 text-xs truncate">{item.cardSet}</p>}
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
