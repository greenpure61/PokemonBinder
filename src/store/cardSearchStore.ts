import { create } from "zustand";
import type { PokeTCGCard, PokeTCGSet } from "@/types/pokemontcg";

const ALL_SUPERTYPES = ["Pokémon", "Trainer", "Energy"];
const PAGE_SIZE = 100;

export type Language = "en" | "ja";

interface CardSearchState {
  query: string;
  results: PokeTCGCard[];
  page: number;
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  language: Language;
  selectedSetId: string;
  selectedTypes: string[];
  supertypes: string[];
  rarity: string;
  sortOrder: "newest" | "name" | "number";
  sets: PokeTCGSet[];
  setsLoaded: boolean;
  enSetNames: Record<string, string>;
  enSetNamesLoaded: boolean;
  rarities: string[];
  raritiesLoaded: boolean;
  ownedCardIds: string[];
  ownedLoaded: boolean;
  setQuery: (q: string) => void;
  setLanguage: (l: Language) => void;
  setSelectedSetId: (id: string) => void;
  setSelectedTypes: (types: string[]) => void;
  setSupertypes: (s: string[]) => void;
  setRarity: (r: string) => void;
  setSortOrder: (s: "newest" | "name" | "number") => void;
  fetchResults: () => Promise<void>;
  loadMore: () => Promise<void>;
  loadSets: () => Promise<void>;
  loadEnSetNames: () => Promise<void>;
  loadRarities: () => Promise<void>;
  loadOwnedCards: () => Promise<void>;
  reset: () => void;
}

async function fetchCards(params: {
  query: string;
  page: number;
  setId: string;
  types: string[];
  supertypes: string[];
  rarity: string;
  sortOrder: "newest" | "name" | "number";
  language: Language;
}) {
  const url = new URL("/api/cards/search", window.location.origin);
  if (params.query) url.searchParams.set("q", params.query);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  url.searchParams.set("lang", params.language);
  if (params.setId) url.searchParams.set("setId", params.setId);
  // Order mode is interpreted server-side (newest = default, name, number)
  url.searchParams.set("orderBy", params.setId ? "number" : params.sortOrder);
  // Only apply type filter when searching Pokémon exclusively
  if (params.types.length && params.supertypes.length === 1 && params.supertypes[0] === "Pokémon")
    url.searchParams.set("types", params.types.join(","));
  // Only send supertypes when it's a subset of all (sending all = no filter needed)
  if (params.supertypes.length > 0 && params.supertypes.length < ALL_SUPERTYPES.length)
    url.searchParams.set("supertypes", params.supertypes.join(","));
  if (params.rarity) url.searchParams.set("rarity", params.rarity);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Card search failed");
  return res.json();
}

export const useCardSearchStore = create<CardSearchState>((set, get) => ({
  query: "",
  results: [],
  page: 1,
  totalCount: 0,
  hasMore: false,
  isLoading: false,
  language: "en",
  selectedSetId: "",
  selectedTypes: [],
  supertypes: ["Pokémon"],
  rarity: "",
  sortOrder: "newest",
  sets: [],
  setsLoaded: false,
  enSetNames: {},
  enSetNamesLoaded: false,
  rarities: [],
  raritiesLoaded: false,
  ownedCardIds: [],
  ownedLoaded: false,

  setQuery: (query) => set({ query, results: [], page: 1 }),
  setSelectedSetId: (selectedSetId) => set({ selectedSetId, results: [], page: 1 }),
  setSelectedTypes: (selectedTypes) => set({ selectedTypes, results: [], page: 1 }),
  setSupertypes: (supertypes) => set({ supertypes, selectedTypes: [], results: [], page: 1 }),
  setRarity: (rarity) => set({ rarity, results: [], page: 1 }),
  setSortOrder: (sortOrder) => set({ sortOrder, results: [], page: 1 }),

  // Sets and rarities are language-specific, and set IDs differ between languages,
  // so switching language clears the cached lists and the selected set.
  setLanguage: (language) =>
    set({
      language,
      selectedSetId: "",
      sets: [],
      setsLoaded: false,
      rarities: [],
      raritiesLoaded: false,
      rarity: "",
      results: [],
      page: 1,
      hasMore: false,
      totalCount: 0,
    }),

  fetchResults: async () => {
    const { query, selectedSetId, selectedTypes, supertypes, rarity, sortOrder, language } = get();
    set({ isLoading: true, results: [], page: 1 });
    try {
      const data = await fetchCards({ query, page: 1, setId: selectedSetId, types: selectedTypes, supertypes, rarity, sortOrder, language });
      set({ results: data.data ?? [], totalCount: data.totalCount ?? 0, hasMore: data.hasMore ?? false, page: 1 });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { query, page, results, hasMore, isLoading, selectedSetId, selectedTypes, supertypes, rarity, sortOrder, language } = get();
    if (isLoading || !hasMore) return;
    const nextPage = page + 1;
    set({ isLoading: true });
    try {
      const data = await fetchCards({ query, page: nextPage, setId: selectedSetId, types: selectedTypes, supertypes, rarity, sortOrder, language });
      const existingIds = new Set(results.map((c) => c.id));
      const newCards = (data.data ?? []).filter((c: { id: string }) => !existingIds.has(c.id));
      set({ results: [...results, ...newCards], page: nextPage, hasMore: data.hasMore ?? false });
    } finally {
      set({ isLoading: false });
    }
  },

  loadSets: async () => {
    if (get().setsLoaded) return;
    try {
      const res = await fetch(`/api/cards/sets?lang=${get().language}`);
      const data = await res.json();
      set({ sets: data.data ?? [], setsLoaded: true });
    } catch {
      // non-fatal — set picker just won't appear
    }
  },

  // English set names, keyed by set id — used to translate the set picker while browsing
  // another language. Sets that share an id across languages (most modern sets) get translated.
  loadEnSetNames: async () => {
    if (get().enSetNamesLoaded) return;
    try {
      const res = await fetch(`/api/cards/sets?lang=en`);
      const data = await res.json();
      const map: Record<string, string> = {};
      for (const s of data.data ?? []) map[s.id] = s.name;
      set({ enSetNames: map, enSetNamesLoaded: true });
    } catch {
      // non-fatal — set names just stay in the browsing language
    }
  },

  loadRarities: async () => {
    if (get().raritiesLoaded) return;
    try {
      const res = await fetch(`/api/cards/rarities?lang=${get().language}`);
      const data = await res.json();
      set({ rarities: data.rarities ?? [], raritiesLoaded: true });
    } catch {
      // non-fatal — rarity filter just won't appear
    }
  },

  loadOwnedCards: async () => {
    if (get().ownedLoaded) return;
    try {
      const res = await fetch("/api/binders/cards");
      if (!res.ok) return;
      const data = await res.json();
      set({ ownedCardIds: data.cardIds ?? [], ownedLoaded: true });
    } catch {
      // non-fatal
    }
  },

  reset: () => set({ query: "", results: [], page: 1, totalCount: 0, hasMore: false, isLoading: false, rarity: "", sortOrder: "newest" }),
}));
