"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { PokeTCGCard } from "@/types/pokemontcg";

interface Props {
  cardId: string | null;
  cardName: string;
  cardImageSmall: string;
  onClose: () => void;
}

export function CardZoomModal({ cardId, cardName, cardImageSmall, onClose }: Props) {
  const [fullCard, setFullCard] = useState<PokeTCGCard | null>(null);
  const open = !!cardId;

  useEffect(() => {
    if (!cardId) { setFullCard(null); return; }
    fetch(`/api/cards/${cardId}`)
      .then((r) => r.json())
      .then(setFullCard)
      .catch(() => null);
  }, [cardId]);

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
