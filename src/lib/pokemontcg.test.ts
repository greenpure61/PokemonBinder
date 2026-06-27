import { describe, it, expect } from "vitest";
import {
  setIdFromCardId,
  isPocketSetId,
  isPocketRarity,
  normalizeSet,
  normalizeFull,
  sortByNumber,
} from "./pokemontcg";

describe("setIdFromCardId", () => {
  it("returns everything before the last dash", () => {
    expect(setIdFromCardId("swsh1-1")).toBe("swsh1");
    expect(setIdFromCardId("sv3pt5-25")).toBe("sv3pt5");
  });

  it("keeps earlier dashes for multi-segment set ids (e.g. the P-A promo set)", () => {
    expect(setIdFromCardId("P-A-1")).toBe("P-A");
  });

  it("returns the whole id when there is no dash", () => {
    expect(setIdFromCardId("base")).toBe("base");
  });

  it("returns the whole id when the only dash is leading", () => {
    expect(setIdFromCardId("-abc")).toBe("-abc");
  });
});

describe("isPocketSetId", () => {
  it("matches TCG Pocket set ids", () => {
    expect(isPocketSetId("A1")).toBe(true);
    expect(isPocketSetId("A1a")).toBe(true);
    expect(isPocketSetId("A2")).toBe(true);
    expect(isPocketSetId("P-A")).toBe(true);
  });

  it("does not match physical set ids", () => {
    expect(isPocketSetId("swsh1")).toBe(false);
    expect(isPocketSetId("base1")).toBe(false);
    expect(isPocketSetId("sv1")).toBe(false);
    expect(isPocketSetId("A")).toBe(false); // needs a digit after A
  });
});

describe("isPocketRarity", () => {
  it("matches Pocket-only rarities (case-insensitive)", () => {
    expect(isPocketRarity("Crown")).toBe(true);
    expect(isPocketRarity("crown")).toBe(true);
    expect(isPocketRarity("One Diamond")).toBe(true);
    expect(isPocketRarity("two star")).toBe(true);
    expect(isPocketRarity("Four Shiny")).toBe(true);
  });

  it("does not match physical rarities", () => {
    expect(isPocketRarity("Rare")).toBe(false);
    expect(isPocketRarity("Rare Holo")).toBe(false);
    // Physical shiny rarities must not be mistaken for "<n> Shiny"
    expect(isPocketRarity("Shiny rare")).toBe(false);
    expect(isPocketRarity("Shiny Ultra Rare")).toBe(false);
  });
});

describe("normalizeSet", () => {
  it("maps TCGdex set fields onto the internal shape", () => {
    const set = normalizeSet({
      id: "sv1",
      name: "Scarlet & Violet",
      symbol: "https://assets.tcgdex.net/en/sv/sv1/symbol",
      logo: "https://assets.tcgdex.net/en/sv/sv1/logo",
      releaseDate: "2023-03-31",
      serie: { id: "sv", name: "Scarlet & Violet" },
      cardCount: { official: 198, total: 258 },
    });

    expect(set).toEqual({
      id: "sv1",
      name: "Scarlet & Violet",
      series: "Scarlet & Violet",
      printedTotal: 198,
      total: 258,
      releaseDate: "2023-03-31",
      images: {
        symbol: "https://assets.tcgdex.net/en/sv/sv1/symbol.webp",
        logo: "https://assets.tcgdex.net/en/sv/sv1/logo.webp",
      },
    });
  });

  it("falls back gracefully on missing optional fields", () => {
    const set = normalizeSet({ id: "x", name: "X" });
    expect(set.series).toBe("");
    expect(set.printedTotal).toBe(0);
    expect(set.total).toBe(0);
    expect(set.releaseDate).toBe("");
    expect(set.images).toEqual({ symbol: "", logo: "" });
  });

  it("uses official count as total when total is absent", () => {
    const set = normalizeSet({ id: "x", name: "X", cardCount: { official: 100 } });
    expect(set.total).toBe(100);
  });
});

describe("normalizeFull", () => {
  it("maps a full card, deriving image urls and supertype", () => {
    const card = normalizeFull({
      id: "sv1-1",
      localId: "1",
      name: "Sprigatito",
      category: "Pokemon",
      rarity: "Common",
      hp: 70,
      types: ["Grass"],
      illustrator: "Some Artist",
      image: "https://assets.tcgdex.net/en/sv/sv1/1",
      set: { id: "sv1", name: "Scarlet & Violet" },
    });

    expect(card.id).toBe("sv1-1");
    expect(card.number).toBe("1");
    expect(card.supertype).toBe("Pokémon");
    expect(card.hp).toBe("70");
    expect(card.types).toEqual(["Grass"]);
    expect(card.artist).toBe("Some Artist");
    expect(card.images).toEqual({
      small: "https://assets.tcgdex.net/en/sv/sv1/1/low.webp",
      large: "https://assets.tcgdex.net/en/sv/sv1/1/high.webp",
    });
    expect(card.set.id).toBe("sv1");
  });

  it("derives an empty set from the card id when the card has no set", () => {
    const card = normalizeFull({ id: "swsh1-1", name: "Card" });
    expect(card.set.id).toBe("swsh1");
    expect(card.set.name).toBe("");
  });

  it("produces empty image urls when the card has no image", () => {
    const card = normalizeFull({ id: "x-1", name: "Card" });
    expect(card.images).toEqual({ small: "", large: "" });
  });
});

describe("sortByNumber", () => {
  const card = (number?: string) => ({
    id: `set-${number ?? "x"}`,
    name: `Card ${number ?? "x"}`,
    supertype: "",
    images: { small: "", large: "" },
    set: normalizeSet({ id: "set", name: "Set" }),
    number,
  });

  it("sorts numerically, not lexicographically", () => {
    const sorted = sortByNumber([card("10"), card("2"), card("1")]);
    expect(sorted.map((c) => c.number)).toEqual(["1", "2", "10"]);
  });

  it("falls back to locale compare for non-numeric numbers", () => {
    const sorted = sortByNumber([card("TG10"), card("TG2"), card("1")]);
    // numeric "1" sorts before the non-numeric ones, which compare as strings
    expect(sorted.map((c) => c.number)).toEqual(["1", "TG10", "TG2"]);
  });

  it("does not mutate the input array", () => {
    const input = [card("2"), card("1")];
    sortByNumber(input);
    expect(input.map((c) => c.number)).toEqual(["2", "1"]);
  });
});
