import { create } from "zustand";
import type { PokeTCGCard, PokeTCGSet } from "@/types/pokemontcg";

const ALL_SUPERTYPES = ["Pokémon", "Trainer", "Energy"];
const PAGE_SIZE = 100;

interface CardSearchState {
  query: string;
  results: PokeTCGCard[];
  page: number;
  totalCount: number;
  isLoading: boolean;
  selectedSetId: string;
  selectedTypes: string[];
  supertypes: string[];
  sets: PokeTCGSet[];
  setsLoaded: boolean;
  setQuery: (q: string) => void;
  setSelectedSetId: (id: string) => void;
  setSelectedTypes: (types: string[]) => void;
  setSupertypes: (s: string[]) => void;
  fetchResults: () => Promise<void>;
  loadMore: () => Promise<void>;
  loadSets: () => Promise<void>;
  reset: () => void;
}

async function fetchCards(params: {
  query: string;
  page: number;
  setId: string;
  types: string[];
  supertypes: string[];
}) {
  const url = new URL("/api/cards/search", window.location.origin);
  if (params.query) url.searchParams.set("q", params.query);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  if (params.setId) url.searchParams.set("setId", params.setId);
  // Set selected → collector number; otherwise newest set first, then by number within set
  url.searchParams.set("orderBy", params.setId ? "number" : "-set.releaseDate,number");
  // Only apply type filter when searching Pokémon exclusively
  if (params.types.length && params.supertypes.length === 1 && params.supertypes[0] === "Pokémon")
    url.searchParams.set("types", params.types.join(","));
  // Only send supertypes when it's a subset of all (sending all = no filter needed)
  if (params.supertypes.length > 0 && params.supertypes.length < ALL_SUPERTYPES.length)
    url.searchParams.set("supertypes", params.supertypes.join(","));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Card search failed");
  return res.json();
}

export const useCardSearchStore = create<CardSearchState>((set, get) => ({
  query: "",
  results: [],
  page: 1,
  totalCount: 0,
  isLoading: false,
  selectedSetId: "",
  selectedTypes: [],
  supertypes: ["Pokémon"],
  sets: [],
  setsLoaded: false,

  setQuery: (query) => set({ query, results: [], page: 1, totalCount: 0 }),
  setSelectedSetId: (selectedSetId) => set({ selectedSetId, results: [], page: 1 }),
  setSelectedTypes: (selectedTypes) => set({ selectedTypes, results: [], page: 1 }),
  setSupertypes: (supertypes) => set({ supertypes, selectedTypes: [], results: [], page: 1 }),

  fetchResults: async () => {
    const { query, selectedSetId, selectedTypes, supertypes } = get();
    set({ isLoading: true, results: [], page: 1 });
    try {
      const data = await fetchCards({ query, page: 1, setId: selectedSetId, types: selectedTypes, supertypes });
      set({ results: data.data ?? [], totalCount: data.totalCount ?? 0, page: 1 });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { query, page, results, totalCount, isLoading, selectedSetId, selectedTypes, supertypes } = get();
    if (isLoading || results.length >= totalCount) return;
    const nextPage = page + 1;
    set({ isLoading: true });
    try {
      const data = await fetchCards({ query, page: nextPage, setId: selectedSetId, types: selectedTypes, supertypes });
      const existingIds = new Set(results.map((c) => c.id));
      const newCards = (data.data ?? []).filter((c: { id: string }) => !existingIds.has(c.id));
      set({ results: [...results, ...newCards], page: nextPage });
    } finally {
      set({ isLoading: false });
    }
  },

  loadSets: async () => {
    if (get().setsLoaded) return;
    try {
      const res = await fetch("/api/cards/sets");
      const data = await res.json();
      set({ sets: data.data ?? [], setsLoaded: true });
    } catch {
      // non-fatal — set picker just won't appear
    }
  },

  reset: () => set({ query: "", results: [], page: 1, totalCount: 0, isLoading: false }),
}));
