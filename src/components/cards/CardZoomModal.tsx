"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { PokeTCGCard } from "@/types/pokemontcg";

interface Props {
  cardId: string | null;
  cardName: string;
  cardImageSmall: string;
  lang?: string;
  onClose: () => void;
}

export function CardZoomModal({ cardId, cardName, cardImageSmall, lang, onClose }: Props) {
  const [fullCard, setFullCard] = useState<PokeTCGCard | null>(null);
  const [wishlistMsg, setWishlistMsg] = useState("");
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const open = !!cardId;

  useEffect(() => {
    if (!cardId) { setFullCard(null); return; }
    setWishlistMsg("");
    setWishlistLoading(false);
    fetch(`/api/cards/${cardId}${lang ? `?lang=${lang}` : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setFullCard)
      .catch(() => null);
  }, [cardId, lang]);

  async function addToWishlist() {
    if (!fullCard || wishlistLoading) return;
    setWishlistLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: fullCard.id,
          cardName: fullCard.name,
          cardImageSmall: fullCard.images.small,
          cardSet: fullCard.set.name,
        }),
      });
      setWishlistMsg(res.status === 201 ? "Added to wishlist!" : "Already in wishlist");
      setTimeout(() => setWishlistMsg(""), 2500);
    } finally {
      setWishlistLoading(false);
    }
  }

  const largeImage = fullCard?.images.large ?? cardImageSmall;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex gap-6 items-start"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card image */}
              <div className="relative w-64 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
                <Image
                  src={largeImage}
                  alt={cardName}
                  fill
                  sizes="256px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Card details */}
              {fullCard && (
                <div className="glass rounded-2xl p-5 max-w-xs self-center">
                  <h2 className="text-lg font-bold text-white mb-1">{fullCard.name}</h2>
                  <p className="text-xs text-white/40 mb-4">{fullCard.set.name} · #{fullCard.number}</p>
                  <div className="space-y-2 text-sm">
                    {fullCard.hp && <Row label="HP" value={fullCard.hp} />}
                    {fullCard.types?.length && <Row label="Type" value={fullCard.types.join(", ")} />}
                    {fullCard.rarity && <Row label="Rarity" value={fullCard.rarity} />}
                    {fullCard.artist && <Row label="Artist" value={fullCard.artist} />}
                  </div>
                  <button
                    onClick={addToWishlist}
                    disabled={wishlistLoading}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/25 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {wishlistMsg || "Add to Wishlist"}
                  </button>
                </div>
              )}

              <button
                onClick={onClose}
                className="absolute top-4 right-4 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors pointer-events-auto"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/40">{label}</span>
      <span className="text-white/80 text-right">{value}</span>
    </div>
  );
}
