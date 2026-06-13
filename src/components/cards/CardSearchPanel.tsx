"use client";

import { useEffect, useRef } from "react";
import { useCardSearchStore } from "@/store/cardSearchStore";
import { CardGrid } from "./CardGrid";

const TYPES = ["Fire", "Water", "Grass", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Dragon", "Colorless"];

export function CardSearchPanel() {
  const { query, setQuery, fetchResults, loadMore, results, isLoading, totalCount, selectedTypes, setSelectedTypes } = useCardSearchStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  function handleQueryChange(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(), 400);
  }

  function toggleType(type: string) {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [type];
    setSelectedTypes(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(), 100);
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Search input */}
      <div className="px-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search cards…"
            className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/25"
          />
        </div>
      </div>

      {/* Type filters */}
      <div className="px-3">
        <div className="flex flex-wrap gap-1">
          {TYPES.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                selectedTypes.includes(type)
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      {totalCount > 0 && (
        <p className="px-3 text-xs text-white/25">{totalCount.toLocaleString()} cards</p>
      )}

      {/* Card grid */}
      <CardGrid
        cards={results}
        isLoading={isLoading}
        hasMore={results.length < totalCount}
        onLoadMore={loadMore}
      />
    </div>
  );
}
