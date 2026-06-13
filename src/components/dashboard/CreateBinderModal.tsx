"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BinderLayout } from "@/types/binder";

const LAYOUTS: { value: BinderLayout; label: string; cols: number; rows: number }[] = [
  { value: "FOUR_POCKET", label: "4-pocket", cols: 2, rows: 2 },
  { value: "NINE_POCKET", label: "9-pocket", cols: 3, rows: 3 },
  { value: "TWELVE_POCKET", label: "12-pocket", cols: 4, rows: 3 },
];

const COVER_COLORS = [
  "#1a1a2e", "#16213e", "#0f3460", "#1b4332",
  "#3d0c02", "#2d1b69", "#1a0533", "#212121",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; pocketLayout: BinderLayout; pageCount: number; coverColor: string }) => void;
  isLoading: boolean;
}

export function CreateBinderModal({ open, onClose, onCreate, isLoading }: Props) {
  const [name, setName] = useState("");
  const [layout, setLayout] = useState<BinderLayout>("NINE_POCKET");
  const [pageCount, setPageCount] = useState(20);
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), pocketLayout: layout, pageCount, coverColor });
  }

  function handleClose() {
    setName("");
    setLayout("NINE_POCKET");
    setPageCount(20);
    setCoverColor(COVER_COLORS[0]);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
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
              <h2 className="text-lg font-semibold text-white mb-5">New Binder</h2>

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
                  <label className="block text-xs text-white/50 mb-2">Pocket Layout</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LAYOUTS.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLayout(l.value)}
                        className={`rounded-xl border p-3 transition-all ${
                          layout === l.value
                            ? "border-white/40 bg-white/10"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div
                          className="grid gap-0.5 mb-2"
                          style={{ gridTemplateColumns: `repeat(${l.cols}, 1fr)` }}
                        >
                          {Array.from({ length: l.cols * l.rows }).map((_, i) => (
                            <div key={i} className="aspect-[2.5/3.5] rounded-sm bg-white/20" />
                          ))}
                        </div>
                        <p className="text-xs text-white/60 text-center">{l.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-1.5">
                    Pages — <span className="text-white/70">{pageCount}</span>
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={100}
                    step={2}
                    value={pageCount}
                    onChange={(e) => setPageCount(Number(e.target.value))}
                    className="w-full accent-white/60"
                  />
                  <div className="flex justify-between text-xs text-white/25 mt-1">
                    <span>4</span><span>100</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-2">Cover Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COVER_COLORS.map((c) => (
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
                    onClick={handleClose}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim() || isLoading}
                    className="flex-1 rounded-xl bg-white py-2.5 text-sm font-medium text-gray-900 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? "Creating…" : "Create"}
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
