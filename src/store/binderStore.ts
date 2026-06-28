import { create } from "zustand";
import type { BinderWithPages, BinderPageWithSlots, SlotCard } from "@/types/binder";
import type { SlotRef } from "@/types/dnd";

function applyCardToPage(
  page: BinderPageWithSlots,
  slotIndex: number,
  card: SlotCard | null
): BinderPageWithSlots {
  const exists = page.slots.find((s) => s.slotIndex === slotIndex);
  const slots = exists
    ? page.slots.map((s) =>
        s.slotIndex === slotIndex
          ? { ...s, cardId: card?.cardId ?? null, cardName: card?.cardName ?? null, cardImageSmall: card?.cardImageSmall ?? null, cardSet: card?.cardSet ?? null }
          : s
      )
    : card
    ? [...page.slots, { id: `tmp-${page.id}-${slotIndex}`, pageId: page.id, slotIndex, cardId: card.cardId, cardName: card.cardName, cardImageSmall: card.cardImageSmall, cardSet: card.cardSet, createdAt: new Date(), updatedAt: new Date() }]
    : page.slots;
  return { ...page, slots };
}

interface BinderState {
  binder: BinderWithPages | null;
  currentSpreadIndex: number;
  currentPageIndex: number;
  armedCard: SlotCard | null;
  isDirty: boolean;
  isSaving: boolean;
  dirtyPageIds: string[];
  setBinder: (b: BinderWithPages) => void;
  updateSlot: (pageId: string, slotIndex: number, card: SlotCard | null) => void;
  swapSlots: (a: SlotRef, b: SlotRef) => void;
  clearAllSlots: () => void;
  goToSpread: (index: number) => void;
  goToPage: (index: number) => void;
  armCard: (card: SlotCard | null) => void;
  updateName: (name: string) => void;
  updateIsPublic: (isPublic: boolean) => void;
  setDirty: (v: boolean) => void;
  setIsSaving: (v: boolean) => void;
  clearDirtyPages: () => void;
}

export const useBinderStore = create<BinderState>((set, get) => ({
  binder: null,
  currentSpreadIndex: 0,
  currentPageIndex: 0,
  armedCard: null,
  isDirty: false,
  isSaving: false,
  dirtyPageIds: [],

  setBinder: (binder) => set({ binder, currentSpreadIndex: 0, currentPageIndex: 0, armedCard: null, isDirty: false, dirtyPageIds: [] }),

  updateSlot: (pageId, slotIndex, card) =>
    set((state) => {
      if (!state.binder) return state;
      return {
        isDirty: true,
        dirtyPageIds: [...new Set([...state.dirtyPageIds, pageId])],
        binder: {
          ...state.binder,
          pages: state.binder.pages.map((p) =>
            p.id === pageId ? applyCardToPage(p, slotIndex, card) : p
          ),
        },
      };
    }),

  swapSlots: (a, b) =>
    set((state) => {
      if (!state.binder) return state;
      const getCard = (pageId: string, slotIndex: number): SlotCard | null => {
        const slot = state.binder!.pages.find((p) => p.id === pageId)?.slots.find((s) => s.slotIndex === slotIndex);
        return slot?.cardId ? { cardId: slot.cardId, cardName: slot.cardName ?? "", cardImageSmall: slot.cardImageSmall ?? "", cardSet: slot.cardSet ?? "" } : null;
      };
      const cardA = getCard(a.pageId, a.slotIndex);
      const cardB = getCard(b.pageId, b.slotIndex);
      return {
        isDirty: true,
        dirtyPageIds: [...new Set([...state.dirtyPageIds, a.pageId, b.pageId])],
        binder: {
          ...state.binder,
          pages: state.binder.pages.map((p) => {
            let page = p;
            if (p.id === a.pageId) page = applyCardToPage(page, a.slotIndex, cardB);
            if (p.id === b.pageId) page = applyCardToPage(page, b.slotIndex, cardA);
            return page;
          }),
        },
      };
    }),

  clearAllSlots: () =>
    set((state) => {
      if (!state.binder) return state;
      const dirty = new Set(state.dirtyPageIds);
      const pages = state.binder.pages.map((p) => {
        if (!p.slots.some((s) => s.cardId)) return p; // nothing to clear on this page
        dirty.add(p.id);
        return {
          ...p,
          slots: p.slots.map((s) => ({
            ...s,
            cardId: null,
            cardName: null,
            cardImageSmall: null,
            cardSet: null,
          })),
        };
      });
      return {
        isDirty: dirty.size > 0 || state.isDirty,
        dirtyPageIds: [...dirty],
        binder: { ...state.binder, pages },
      };
    }),

  goToSpread: (index) => {
    const { binder } = get();
    if (!binder) return;
    const maxSpread = Math.ceil(binder.pageCount / 2) - 1;
    const spread = Math.max(0, Math.min(index, maxSpread));
    // Keep the page index in sync so switching to the mobile (one-page) view lands
    // on the first page of the current spread.
    set({ currentSpreadIndex: spread, currentPageIndex: spread * 2 });
  },

  goToPage: (index) => {
    const { binder } = get();
    if (!binder) return;
    const page = Math.max(0, Math.min(index, binder.pageCount - 1));
    set({ currentPageIndex: page, currentSpreadIndex: Math.floor(page / 2) });
  },

  armCard: (armedCard) => set({ armedCard }),

  updateName: (name) => set((state) => ({
    binder: state.binder ? { ...state.binder, name } : null,
  })),

  updateIsPublic: (isPublic) => set((state) => ({
    binder: state.binder ? { ...state.binder, isPublic } : null,
  })),

  setDirty: (isDirty) => set({ isDirty }),
  setIsSaving: (isSaving) => set({ isSaving }),
  clearDirtyPages: () => set({ dirtyPageIds: [], isDirty: false }),
}));
