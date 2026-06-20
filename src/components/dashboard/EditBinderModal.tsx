"use client";

import { useState } from "react";
import type { BinderListItem } from "@/hooks/useBinderData";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field, ColorSwatches } from "./binderForm";
import { COVER_COLORS } from "@/lib/binderCovers";

interface Props {
  binder: BinderListItem | null;
  onClose: () => void;
  onSave: (binderId: string, data: { name: string; coverColor: string }) => void;
  isLoading: boolean;
}

export function EditBinderModal({ binder, onClose, onSave, isLoading }: Props) {
  const [trackedId, setTrackedId] = useState<string | null>(binder?.id ?? null);
  const [name, setName] = useState(binder?.name ?? "");
  const [coverColor, setCoverColor] = useState(binder?.coverColor ?? COVER_COLORS[0]);

  // Sync the form to the opened binder during render (React's recommended
  // alternative to a prop-syncing effect). Also resets when the modal closes,
  // so reopening the same binder restores its saved values.
  if (!binder && trackedId !== null) {
    setTrackedId(null);
  } else if (binder && binder.id !== trackedId) {
    setTrackedId(binder.id);
    setName(binder.name);
    setCoverColor(binder.coverColor);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!binder || !name.trim()) return;
    onSave(binder.id, { name: name.trim(), coverColor });
  }

  // Surface a custom (non-preset) color as a swatch so it stays selectable.
  const colors = COVER_COLORS.includes(coverColor) ? COVER_COLORS : [coverColor, ...COVER_COLORS];

  return (
    <Modal
      open={!!binder}
      onClose={onClose}
      title="Edit binder"
      description="Update your binder's name and cover."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-binder-form" loading={isLoading} disabled={!name.trim()}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-binder-form" onSubmit={handleSubmit} className="space-y-5">
        <Field label="Name">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="My collection" />
        </Field>
        <Field label="Cover color">
          <ColorSwatches value={coverColor} onChange={setCoverColor} colors={colors} />
        </Field>
      </form>
    </Modal>
  );
}
