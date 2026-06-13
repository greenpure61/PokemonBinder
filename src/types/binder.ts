import { Binder, BinderPage, CardSlot, BinderLayout } from "@prisma/client";

export type { BinderLayout };

export interface SlotCard {
  cardId: string;
  cardName: string;
  cardImageSmall: string;
  cardSet: string;
}

export type CardSlotWithCard = CardSlot;

export type BinderPageWithSlots = BinderPage & {
  slots: CardSlotWithCard[];
};

export type BinderWithPages = Binder & {
  pages: BinderPageWithSlots[];
};

export interface CreateBinderInput {
  name: string;
  description?: string;
  coverColor?: string;
  pocketLayout?: BinderLayout;
  pageCount?: number;
}

export interface UpdateBinderInput {
  name?: string;
  description?: string;
  coverColor?: string;
  isPublic?: boolean;
}

export interface UpdateSlotInput {
  slotIndex: number;
  cardId: string | null;
  cardName: string | null;
  cardImageSmall: string | null;
  cardSet: string | null;
}
