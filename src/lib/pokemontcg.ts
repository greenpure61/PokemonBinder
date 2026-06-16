// Card data source: TCGdex (https://api.tcgdex.net/v2) — multilingual Pokémon TCG API.
// Responses are normalized into the app's internal PokeTCG* shapes (see types/pokemontcg.ts),
// which keep their historical names but are now source-agnostic.
import type { CardSearchParams, PokeTCGCard, PokeTCGResponse, PokeTCGSet, PokeTCGSetsResponse } from "@/types/pokemontcg";

const BASE = "https://api.tcgdex.net/v2";
const REVALIDATE = 3600;

type Lang = "en" | "ja";
function asLang(l?: string): Lang {
  return l === "ja" ? "ja" : "en";
}

// TCGdex image fields are extensionless base URLs; append quality + format.
function cardImage(base: string | undefined, quality: "low" | "high"): string {
  return base ? `${base}/${quality}.webp` : "";
}
function assetImage(base: string | undefined): string {
  return base ? `${base}.webp` : "";
}

const CATEGORY_TO_SUPERTYPE: Record<string, string> = { Pokemon: "Pokémon", Trainer: "Trainer", Energy: "Energy" };
const SUPERTYPE_TO_CATEGORY: Record<string, string> = { "Pokémon": "Pokemon", Trainer: "Trainer", Energy: "Energy" };

interface TCGBriefCard {
  id: string;
  localId?: string;
  name: string;
  image?: string;
}
interface TCGSetObject {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  releaseDate?: string;
  serie?: { id: string; name: string };
  cardCount?: { official?: number; total?: number };
  cards?: TCGBriefCard[];
}
interface TCGFullCard extends TCGBriefCard {
  category?: string;
  rarity?: string;
  hp?: number;
  types?: string[];
  illustrator?: string;
  set?: TCGSetObject;
}

// Card id is `${setId}-${localId}`; the set id is everything before the last dash.
function setIdFromCardId(id: string): string {
  const i = id.lastIndexOf("-");
  return i > 0 ? id.slice(0, i) : id;
}

function emptySet(id: string): PokeTCGSet {
  return { id, name: "", series: "", printedTotal: 0, total: 0, releaseDate: "", images: { symbol: "", logo: "" } };
}

function normalizeSet(s: TCGSetObject): PokeTCGSet {
  return {
    id: s.id,
    name: s.name,
    series: s.serie?.name ?? "",
    printedTotal: s.cardCount?.official ?? 0,
    total: s.cardCount?.total ?? s.cardCount?.official ?? 0,
    releaseDate: s.releaseDate ?? "",
    images: { symbol: assetImage(s.symbol), logo: assetImage(s.logo) },
  };
}

function normalizeBrief(c: TCGBriefCard, set: PokeTCGSet): PokeTCGCard {
  return {
    id: c.id,
    name: c.name,
    supertype: "",
    images: { small: cardImage(c.image, "low"), large: cardImage(c.image, "high") },
    set,
    number: c.localId,
  };
}

function normalizeFull(c: TCGFullCard): PokeTCGCard {
  const set = c.set ? normalizeSet(c.set) : emptySet(setIdFromCardId(c.id));
  return {
    id: c.id,
    name: c.name,
    supertype: c.category ? (CATEGORY_TO_SUPERTYPE[c.category] ?? c.category) : "",
    types: c.types,
    rarity: c.rarity,
    images: { small: cardImage(c.image, "low"), large: cardImage(c.image, "high") },
    set,
    number: c.localId,
    artist: c.illustrator,
    hp: c.hp != null ? String(c.hp) : undefined,
  };
}

function sortByNumber(cards: PokeTCGCard[]): PokeTCGCard[] {
  return [...cards].sort((a, b) => {
    const na = parseInt(a.number ?? "", 10);
    const nb = parseInt(b.number ?? "", 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
    return (a.number ?? "").localeCompare(b.number ?? "");
  });
}

export async function searchCards(params: CardSearchParams): Promise<PokeTCGResponse> {
  const lang = asLang(params.lang);
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 100;

  // A selected set: fetch the whole set in one request (TCGdex returns every card).
  if (params.setId) {
    const res = await fetch(`${BASE}/${lang}/sets/${encodeURIComponent(params.setId)}`, { next: { revalidate: REVALIDATE } });
    if (res.status === 404) return { data: [], page: 1, pageSize: 0, count: 0, totalCount: 0, hasMore: false };
    if (!res.ok) throw new Error(`TCGdex API error: ${res.status}`);
    const data: TCGSetObject = await res.json();
    const set = normalizeSet(data);
    const cards = sortByNumber((data.cards ?? []).map((c) => normalizeBrief(c, set)));
    return { data: cards, page: 1, pageSize: cards.length, count: cards.length, totalCount: set.total || cards.length, hasMore: false };
  }

  // General search via the /cards endpoint with field filters + pagination.
  const url = new URL(`${BASE}/${lang}/cards`);
  if (params.query) url.searchParams.set("name", params.query);
  // TCGdex filters one category at a time; only filter when a single supertype is chosen.
  if (params.supertypes?.length === 1) {
    url.searchParams.set("category", SUPERTYPE_TO_CATEGORY[params.supertypes[0]] ?? params.supertypes[0]);
  }
  if (params.types?.length) url.searchParams.set("types", params.types[0]);
  if (params.rarity) url.searchParams.set("rarity", params.rarity);
  if (params.orderBy === "name") {
    url.searchParams.set("sort:field", "name");
    url.searchParams.set("sort:order", "ASC");
  } else if (params.orderBy === "number") {
    url.searchParams.set("sort:field", "localId");
    url.searchParams.set("sort:order", "ASC");
  } // else default ordering (release date)
  url.searchParams.set("pagination:page", String(page));
  url.searchParams.set("pagination:itemsPerPage", String(pageSize));

  const res = await fetch(url.toString(), { next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`TCGdex API error: ${res.status}`);
  const briefs: TCGBriefCard[] = await res.json();
  const cards = briefs.map((c) => normalizeBrief(c, emptySet(setIdFromCardId(c.id))));
  return { data: cards, page, pageSize, count: cards.length, totalCount: 0, hasMore: cards.length >= pageSize };
}

export async function getCardById(id: string, lang?: string): Promise<PokeTCGCard | null> {
  const res = await fetch(`${BASE}/${asLang(lang)}/cards/${encodeURIComponent(id)}`, { next: { revalidate: REVALIDATE } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TCGdex API error: ${res.status}`);
  const data: TCGFullCard = await res.json();
  return normalizeFull(data);
}

export async function getSets(lang?: string): Promise<PokeTCGSetsResponse> {
  const res = await fetch(`${BASE}/${asLang(lang)}/sets`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`TCGdex API error: ${res.status}`);
  const arr: TCGSetObject[] = await res.json();
  // TCGdex returns sets chronologically; reverse for newest-first in the picker.
  // Some language lists contain duplicate set IDs, so dedupe (keeping the first/newest).
  const seen = new Set<string>();
  const sets = arr
    .map(normalizeSet)
    .reverse()
    .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  return { data: sets, page: 1, pageSize: sets.length, count: sets.length, totalCount: sets.length };
}

export async function getRarities(lang?: string): Promise<string[]> {
  const res = await fetch(`${BASE}/${asLang(lang)}/rarities`, { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const arr = await res.json();
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.filter((r): r is string => typeof r === "string" && r !== "None"))];
}
