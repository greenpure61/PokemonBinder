"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BinderListItem } from "@/hooks/useBinderData";

const COVER_COLORS = [
  "#1a1a2e", "#16213e", "#0f3460", "#1b4332",
  "#3d0c02", "#2d1b69", "#1a0533", "#212121",
];

interface Props {
  binder: BinderListItem | null;
  onClose: () => void;
  onSave: (binderId: string, data: { name: string; coverColor: string }) => void;
  isLoading: boolean;
}

export function EditBinderModal({ binder, onClose, onSave, isLoading }: Props) {
  const [name, setName] = useState("");
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);

  useEffect(() => {
    if (binder) {
      setName(binder.name);
      setCoverColor(binder.coverColor);
    }
  }, [binder]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!binder || !name.trim()) return;
    onSave(binder.id, { name: name.trim(), coverColor });
  }

  // Include the binder's current color in the swatch list if it's a custom one
  const colors = COVER_COLORS.includes(coverColor) ? COVER_COLORS : [coverColor, ...COVER_COLORS];

  return (
    <AnimatePresence>
      {binder && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="glass rounded-2xl w-full max-w-md p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-white mb-5">Edit Binder</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Name</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Collection"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-2">Cover Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCoverColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          coverColor === c ? "border-white scale-110" : "border-transparent hover:border-white/40"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim() || isLoading}
                    className="flex-1 rounded-xl bg-white py-2.5 text-sm font-medium text-gray-900 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
