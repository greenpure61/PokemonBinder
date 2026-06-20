"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Star, X } from "lucide-react";
import type { PokeTCGCard } from "@/types/pokemontcg";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Props {
  cardId: string | null;
  cardName: string;
  cardImageSmall: string;
  lang?: string;
  onClose: () => void;
}

export function CardZoomModal({ cardId, cardName, cardImageSmall, lang, onClose }: Props) {
  const [fullCard, setFullCard] = useState<PokeTCGCard | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [trackedId, setTrackedId] = useState<string | null>(cardId);
  const { toast } = useToast();
  const open = !!cardId;

  // Reset details when a different card opens (render-phase, not an effect).
  if (cardId !== trackedId) {
    setTrackedId(cardId);
    setFullCard(null);
    setWishlistLoading(false);
  }

  useEffect(() => {
    if (!cardId) return;
    let active = true;
    fetch(`/api/cards/${cardId}${lang ? `?lang=${lang}` : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (active) setFullCard(c);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
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
      if (res.status === 201) toast("Added to wishlist", "success");
      else toast("Already in your wishlist", "info");
    } finally {
      setWishlistLoading(false);
    }
  }

  const largeImage = fullCard?.images.large ?? cardImageSmall;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
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
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex flex-col items-center gap-5 sm:flex-row sm:items-start"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card image */}
              <div className="relative aspect-[2.5/3.5] w-56 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl sm:w-64">
                <Image src={largeImage} alt={cardName} fill sizes="256px" className="object-cover" priority />
              </div>

              {/* Card details */}
              {fullCard && (
                <div className="w-full max-w-xs self-stretch rounded-2xl border border-border bg-surface p-5 shadow-xl sm:self-center">
                  <h2 className="text-lg font-bold text-foreground">{fullCard.name}</h2>
                  <p className="mb-4 mt-0.5 text-xs text-muted">
                    {fullCard.set.name} · #{fullCard.number}
                  </p>
                  <div className="space-y-2 text-sm">
                    {fullCard.hp && <Row label="HP" value={fullCard.hp} />}
                    {fullCard.types?.length ? <Row label="Type" value={fullCard.types.join(", ")} /> : null}
                    {fullCard.rarity && <Row label="Rarity" value={fullCard.rarity} />}
                    {fullCard.artist && <Row label="Artist" value={fullCard.artist} />}
                  </div>
                  <Button
                    variant="accent"
                    onClick={addToWishlist}
                    loading={wishlistLoading}
                    className="mt-5 w-full"
                  >
                    <Star className="h-4 w-4" />
                    Add to wishlist
                  </Button>
                </div>
              )}

              <button
                onClick={onClose}
                aria-label="Close"
                className="pointer-events-auto absolute right-2 top-2 cursor-pointer rounded-full bg-surface p-2 text-muted shadow-md transition-colors hover:text-foreground sm:right-4 sm:top-4"
              >
                <X className="h-4 w-4" />
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
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
