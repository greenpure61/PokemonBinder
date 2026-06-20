import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBinderStore } from "@/store/binderStore";

export function useBinderPersist() {
  const binder = useBinderStore((s) => s.binder);
  const isDirty = useBinderStore((s) => s.isDirty);
  const dirtyPageIds = useBinderStore((s) => s.dirtyPageIds);
  const setIsSaving = useBinderStore((s) => s.setIsSaving);
  const clearDirtyPages = useBinderStore((s) => s.clearDirtyPages);
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty || !binder || dirtyPageIds.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await Promise.all(
          dirtyPageIds.map(async (pageId) => {
            const page = binder.pages.find((p) => p.id === pageId);
            if (!page) return;
            await fetch(`/api/binders/${binder.id}/pages/${pageId}/slots`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                slots: page.slots.map((s) => ({
                  slotIndex: s.slotIndex,
                  cardId: s.cardId,
                  cardName: s.cardName,
                  cardImageSmall: s.cardImageSmall,
                  cardSet: s.cardSet,
                })),
              }),
            });
          })
        );
        clearDirtyPages();
        // Keep React Query in sync with what we just persisted so a later mount
        // (e.g. full reload) or the dashboard list reflects the saved state.
        qc.setQueryData(["binder", binder.id], binder);
        qc.invalidateQueries({ queryKey: ["binders"] });
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, dirtyPageIds, binder, qc]);
}
