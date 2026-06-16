import { create } from "zustand";
import type { PokeTCGCard } from "@/types/pokemontcg";

interface CardSearchState {
  query: string;
  results: PokeTCGCard[];
  page: number;
  totalCount: number;
  isLoading: boolean;
  selectedSetId: string;
  selectedTypes: string[];
  supertype: string;
  setQuery: (q: string) => void;
  setSelectedSetId: (id: string) => void;
  setSelectedTypes: (types: string[]) => void;
  setSupertype: (s: string) => void;
  fetchResults: () => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

const PAGE_SIZE = 100;

async function fetchCards(params: {
  query: string;
  page: number;
  setId: string;
  types: string[];
  supertype: string;
}) {
  const url = new URL("/api/cards/search", window.location.origin);
  if (params.query) url.searchParams.set("q", params.query);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  if (params.setId) url.searchParams.set("setId", params.setId);
  // Types only apply to Pokémon cards
  if (params.types.length && params.supertype === "Pokémon")
    url.searchParams.set("types", params.types.join(","));
  if (params.supertype) url.searchParams.set("supertype", params.supertype);

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
  supertype: "Pokémon",

  setQuery: (query) => set({ query, results: [], page: 1, totalCount: 0 }),
  setSelectedSetId: (selectedSetId) => set({ selectedSetId, results: [], page: 1 }),
  setSelectedTypes: (selectedTypes) => set({ selectedTypes, results: [], page: 1 }),
  setSupertype: (supertype) => set({ supertype, selectedTypes: [], results: [], page: 1 }),

  fetchResults: async () => {
    const { query, selectedSetId, selectedTypes, supertype } = get();
    set({ isLoading: true, results: [], page: 1 });
    try {
      const data = await fetchCards({ query, page: 1, setId: selectedSetId, types: selectedTypes, supertype });
      set({ results: data.data ?? [], totalCount: data.totalCount ?? 0, page: 1 });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { query, page, results, totalCount, isLoading, selectedSetId, selectedTypes, supertype } = get();
    if (isLoading || results.length >= totalCount) return;
    const nextPage = page + 1;
    set({ isLoading: true });
    try {
      const data = await fetchCards({ query, page: nextPage, setId: selectedSetId, types: selectedTypes, supertype });
      const existingIds = new Set(results.map((c) => c.id));
      const newCards = (data.data ?? []).filter((c: { id: string }) => !existingIds.has(c.id));
      set({ results: [...results, ...newCards], page: nextPage });
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({ query: "", results: [], page: 1, totalCount: 0, isLoading: false }),
}));
