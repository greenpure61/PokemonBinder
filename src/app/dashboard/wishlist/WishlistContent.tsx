"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface WishlistItem {
  id: string;
  cardId: string;
  cardName: string;
  cardImageSmall: string | null;
  cardSet: string | null;
  createdAt: string;
}

export function WishlistContent() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  async function removeItem(cardId: string) {
    await fetch(`/api/wishlist/${encodeURIComponent(cardId)}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.cardId !== cardId));
  }

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
          <span className="text-xs text-white/30 ml-auto">{items.length} card{items.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
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
            <p className="text-sm text-white/30 mt-1">Right-click any card in your binder to add it here</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          >
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.cardId}
                  layout
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 28 } },
                  }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="group relative aspect-[2.5/3.5]"
                >
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
                  <button
                    onClick={() => removeItem(item.cardId)}
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
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
