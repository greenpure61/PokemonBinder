import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBinderStore } from "@/store/binderStore";
import type { BinderWithPages } from "@/types/binder";

export function useBinderPersist() {
  const binder = useBinderStore((s) => s.binder);
  const isDirty = useBinderStore((s) => s.isDirty);
  const dirtyPageIds = useBinderStore((s) => s.dirtyPageIds);
  const setIsSaving = useBinderStore((s) => s.setIsSaving);
  const clearDirtyPages = useBinderStore((s) => s.clearDirtyPages);
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (b: BinderWithPages, pageIds: string[], keepalive = false) => {
      setIsSaving(true);
      try {
        await Promise.all(
          pageIds.map(async (pageId) => {
            const page = b.pages.find((p) => p.id === pageId);
            if (!page) return;
            await fetch(`/api/binders/${b.id}/pages/${pageId}/slots`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              keepalive,
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
        // Keep React Query in sync with what we just persisted so the dashboard
        // list and a future editor mount reflect the saved state.
        qc.setQueryData(["binder", b.id], b);
        qc.invalidateQueries({ queryKey: ["binders"] });
      } finally {
        setIsSaving(false);
      }
    },
    [qc, clearDirtyPages, setIsSaving]
  );

  // Debounced autosave while editing.
  useEffect(() => {
    if (!isDirty || !binder || dirtyPageIds.length === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(binder, dirtyPageIds), 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, dirtyPageIds, binder, save]);

  // Flush pending edits immediately when leaving the editor, so navigating
  // straight to the dashboard persists first and refreshes its list.
  useEffect(() => {
    return () => {
      const { binder: b, dirtyPageIds: ids } = useBinderStore.getState();
      if (b && ids.length > 0) {
        if (timerRef.current) clearTimeout(timerRef.current);
        void save(b, ids, true);
      }
    };
  }, [save]);
}
