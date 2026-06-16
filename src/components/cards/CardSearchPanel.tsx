"use client";

import { useEffect, useRef, useState } from "react";
import { useCardSearchStore } from "@/store/cardSearchStore";
import { CardGrid } from "./CardGrid";
import type { PokeTCGSet } from "@/types/pokemontcg";

const TYPES = ["Fire", "Water", "Grass", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Dragon", "Colorless"];
const SUPERTYPES = ["Pokémon", "Trainer", "Energy"];

export function CardSearchPanel() {
  const {
    query, setQuery, fetchResults, loadMore, results, isLoading, totalCount,
    selectedTypes, setSelectedTypes, selectedSetId, setSelectedSetId,
    supertype, setSupertype,
  } = useCardSearchStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sets, setSets] = useState<PokeTCGSet[]>([]);

  useEffect(() => {
    fetchResults();
    fetch("/api/cards/sets")
      .then((r) => r.json())
      .then((data) => setSets(data.data ?? []));
  }, []);

  function trigger(delay = 400) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(), delay);
  }

  function handleQueryChange(q: string) {
    setQuery(q);
    trigger();
  }

  function clearSearch() {
    handleQueryChange("");
    inputRef.current?.focus();
  }

  function toggleType(type: string) {
    setSelectedTypes(selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [type]);
    trigger(100);
  }

  function handleSupertypeChange(st: string) {
    setSupertype(st);
    trigger(100);
  }

  function handleSetChange(setId: string) {
    setSelectedSetId(setId);
    trigger(100);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header + search */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0 space-y-2">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Card Library</p>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search cards…"
            className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-8 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Supertype tabs */}
        <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5">
          {SUPERTYPES.map((st) => (
            <button
              key={st}
              onClick={() => handleSupertypeChange(st)}
              className={`flex-1 rounded-md py-1 text-[11px] font-medium transition-colors ${
                supertype === st ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Type filters — Pokémon only */}
      {supertype === "Pokémon" && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="flex flex-wrap gap-1">
            {TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                  selectedTypes.includes(type)
                    ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border border-transparent"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Set filter */}
      {sets.length > 0 && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="relative">
            <select
              value={selectedSetId}
              onChange={(e) => handleSetChange(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="w-full appearance-none rounded-lg bg-white/5 border border-white/10 pl-2.5 pr-7 py-1.5 text-xs text-white/70 focus:outline-none focus:border-white/25 transition-colors cursor-pointer"
            >
              <option value="">All sets</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* Result count */}
      <div className="px-3 pb-1.5 flex-shrink-0 h-5">
        {isLoading ? (
          <p className="text-xs text-white/20">Searching…</p>
        ) : totalCount > 0 ? (
          <p className="text-xs text-white/25">
            {totalCount.toLocaleString()} {totalCount === 1 ? "card" : "cards"}
          </p>
        ) : null}
      </div>

      {/* Card grid */}
      <CardGrid
        cards={results}
        isLoading={isLoading}
        hasMore={results.length < totalCount}
        onLoadMore={loadMore}
        emptyMessage={query ? `No results for "${query}"` : "No cards found"}
      />
    </div>
  );
}
