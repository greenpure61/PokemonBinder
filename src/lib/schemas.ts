import { z } from "zod";

// Request validation schemas, shared by the route handlers. Bounds are
// deliberately conservative — card data originates from our own catalog proxy,
// so these mainly guard against malformed or abusive payloads.

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const URL_FIELD = z.string().max(2048);
const CARD_TEXT = z.string().max(300);

export const pocketLayoutSchema = z.enum(["FOUR_POCKET", "NINE_POCKET", "TWELVE_POCKET"]);

export const createBinderSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  coverColor: z.string().regex(HEX_COLOR, "Must be a hex color like #1a1a2e").optional(),
  pocketLayout: pocketLayoutSchema.optional(),
  pageCount: z.number().int().min(1).max(100).optional(),
});

export const updateBinderSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  coverColor: z.string().regex(HEX_COLOR, "Must be a hex color like #1a1a2e").optional(),
  isPublic: z.boolean().optional(),
});

// One pocket page holds at most 12 slots (TWELVE_POCKET), indexed 0-11. The
// handler additionally checks each slotIndex against the binder's actual layout.
export const slotSchema = z.object({
  slotIndex: z.number().int().min(0).max(11),
  cardId: CARD_TEXT.nullable(),
  cardName: CARD_TEXT.nullable(),
  cardImageSmall: URL_FIELD.nullable(),
  cardSet: CARD_TEXT.nullable(),
});

export const updateSlotsSchema = z.object({
  slots: z.array(slotSchema).max(12),
});

export const wishlistItemSchema = z.object({
  cardId: z.string().min(1).max(300),
  cardName: z.string().min(1).max(300),
  cardImageSmall: URL_FIELD.nullable().optional(),
  cardSet: CARD_TEXT.nullable().optional(),
});

export const cardSearchQuerySchema = z.object({
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(250).default(20),
  setId: z.string().max(100).optional(),
  // "newest" falls through to the catalog's default (release-date) ordering.
  orderBy: z.enum(["newest", "name", "number"]).optional(),
  types: z.string().max(200).optional(),
  supertypes: z.string().max(200).optional(),
  rarity: z.string().max(100).optional(),
  lang: z.enum(["en", "ja"]).optional(),
});
