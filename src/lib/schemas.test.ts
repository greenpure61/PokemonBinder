// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  createBinderSchema,
  updateBinderSchema,
  updateSlotsSchema,
  wishlistItemSchema,
  cardSearchQuerySchema,
} from "./schemas";

describe("createBinderSchema", () => {
  it("accepts a minimal valid payload and trims the name", () => {
    const result = createBinderSchema.parse({ name: "  My Binder  " });
    expect(result.name).toBe("My Binder");
  });

  it("accepts a full valid payload", () => {
    const result = createBinderSchema.parse({
      name: "Binder",
      description: "desc",
      coverColor: "#1a1a2e",
      pocketLayout: "NINE_POCKET",
      pageCount: 20,
    });
    expect(result.pocketLayout).toBe("NINE_POCKET");
  });

  it("rejects an empty name", () => {
    expect(createBinderSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects an overly long name", () => {
    expect(createBinderSchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
  });

  it("rejects an invalid cover color", () => {
    expect(createBinderSchema.safeParse({ name: "B", coverColor: "red" }).success).toBe(false);
  });

  it("rejects an unknown pocket layout", () => {
    expect(createBinderSchema.safeParse({ name: "B", pocketLayout: "SIX_POCKET" }).success).toBe(false);
  });

  it("rejects a page count outside bounds", () => {
    expect(createBinderSchema.safeParse({ name: "B", pageCount: 0 }).success).toBe(false);
    expect(createBinderSchema.safeParse({ name: "B", pageCount: 1000 }).success).toBe(false);
  });
});

describe("updateBinderSchema", () => {
  it("accepts a partial update", () => {
    expect(updateBinderSchema.parse({ isPublic: true })).toEqual({ isPublic: true });
  });

  it("allows description to be null", () => {
    expect(updateBinderSchema.parse({ description: null }).description).toBeNull();
  });

  it("rejects a non-boolean isPublic", () => {
    expect(updateBinderSchema.safeParse({ isPublic: "yes" }).success).toBe(false);
  });
});

describe("updateSlotsSchema", () => {
  const slot = (slotIndex: number) => ({
    slotIndex,
    cardId: "sv1-1",
    cardName: "Card",
    cardImageSmall: "https://img/x.webp",
    cardSet: "sv1",
  });

  it("accepts valid slots, including cleared (null) ones", () => {
    const result = updateSlotsSchema.parse({
      slots: [slot(0), { slotIndex: 1, cardId: null, cardName: null, cardImageSmall: null, cardSet: null }],
    });
    expect(result.slots).toHaveLength(2);
  });

  it("rejects a negative slot index", () => {
    expect(updateSlotsSchema.safeParse({ slots: [slot(-1)] }).success).toBe(false);
  });

  it("rejects a slot index above the max page size", () => {
    expect(updateSlotsSchema.safeParse({ slots: [slot(12)] }).success).toBe(false);
  });

  it("rejects more than 12 slots", () => {
    const slots = Array.from({ length: 13 }, (_, i) => slot(i % 12));
    expect(updateSlotsSchema.safeParse({ slots }).success).toBe(false);
  });
});

describe("wishlistItemSchema", () => {
  it("accepts a valid item with optional fields omitted", () => {
    expect(wishlistItemSchema.parse({ cardId: "sv1-1", cardName: "Card" }).cardId).toBe("sv1-1");
  });

  it("rejects a missing card name", () => {
    expect(wishlistItemSchema.safeParse({ cardId: "sv1-1" }).success).toBe(false);
  });

  it("rejects an empty card id", () => {
    expect(wishlistItemSchema.safeParse({ cardId: "", cardName: "Card" }).success).toBe(false);
  });
});

describe("cardSearchQuerySchema", () => {
  it("applies defaults for page and pageSize", () => {
    expect(cardSearchQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
  });

  it("coerces numeric strings from the query string", () => {
    const result = cardSearchQuerySchema.parse({ page: "3", pageSize: "50" });
    expect(result).toMatchObject({ page: 3, pageSize: 50 });
  });

  it("rejects a pageSize above the cap", () => {
    expect(cardSearchQuerySchema.safeParse({ pageSize: "1000" }).success).toBe(false);
  });

  it("rejects an unsupported language", () => {
    expect(cardSearchQuerySchema.safeParse({ lang: "fr" }).success).toBe(false);
  });

  it("accepts every sort order the UI can send", () => {
    for (const orderBy of ["newest", "name", "number"]) {
      expect(cardSearchQuerySchema.safeParse({ orderBy }).success).toBe(true);
    }
    expect(cardSearchQuerySchema.safeParse({ orderBy: "release" }).success).toBe(false);
  });
});
