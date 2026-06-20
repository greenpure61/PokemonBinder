"use client";

import { useState } from "react";
import type { BinderLayout } from "@/types/binder";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field, ColorSwatches } from "./binderForm";
import { COVER_COLORS } from "@/lib/binderCovers";
import { cn } from "@/lib/utils";

const LAYOUTS: { value: BinderLayout; label: string; cols: number; rows: number }[] = [
  { value: "FOUR_POCKET", label: "4-pocket", cols: 2, rows: 2 },
  { value: "NINE_POCKET", label: "9-pocket", cols: 3, rows: 3 },
  { value: "TWELVE_POCKET", label: "12-pocket", cols: 4, rows: 3 },
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

  function reset() {
    setName("");
    setLayout("NINE_POCKET");
    setPageCount(20);
    setCoverColor(COVER_COLORS[0]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), pocketLayout: layout, pageCount, coverColor });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New binder"
      description="Set up a binder to start collecting."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-binder-form" loading={isLoading} disabled={!name.trim()}>
            Create binder
          </Button>
        </>
      }
    >
      <form id="create-binder-form" onSubmit={handleSubmit} className="space-y-5">
        <Field label="Name">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Scarlet & Violet Masters"
          />
        </Field>

        <Field label="Pocket layout">
          <div className="grid grid-cols-3 gap-2">
            {LAYOUTS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLayout(l.value)}
                aria-pressed={layout === l.value}
                className={cn(
                  "cursor-pointer rounded-xl border p-3 transition-colors",
                  layout === l.value
                    ? "border-primary bg-primary-soft"
                    : "border-border hover:border-border-strong hover:bg-surface-muted"
                )}
              >
                <div className="mx-auto grid w-12 gap-0.5" style={{ gridTemplateColumns: `repeat(${l.cols}, 1fr)` }}>
                  {Array.from({ length: l.cols * l.rows }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "aspect-[2.5/3.5] rounded-[2px]",
                        layout === l.value ? "bg-primary/30" : "bg-border-strong"
                      )}
                    />
                  ))}
                </div>
                <p className={cn("mt-2 text-center text-xs font-medium", layout === l.value ? "text-primary" : "text-muted")}>
                  {l.label}
                </p>
              </button>
            ))}
          </div>
        </Field>

        <Field
          label={
            <span>
              Pages — <span className="text-foreground">{pageCount}</span>
            </span>
          }
        >
          <input
            type="range"
            min={4}
            max={100}
            step={2}
            value={pageCount}
            onChange={(e) => setPageCount(Number(e.target.value))}
            className="w-full cursor-pointer accent-primary"
          />
          <div className="mt-1 flex justify-between text-xs text-subtle">
            <span>4</span>
            <span>100</span>
          </div>
        </Field>

        <Field label="Cover color">
          <ColorSwatches value={coverColor} onChange={setCoverColor} colors={COVER_COLORS} />
        </Field>
      </form>
    </Modal>
  );
}
