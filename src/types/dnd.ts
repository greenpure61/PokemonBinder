export type DragItemType = "SEARCH_CARD" | "SLOT_CARD";

export interface DragItem {
  type: DragItemType;
  cardId: string;
  cardName: string;
  cardImageSmall: string;
  cardSet: string;
  sourceSlotIndex?: number;
  sourcePageId?: string;
}

export interface SlotRef {
  pageId: string;
  slotIndex: number;
}
