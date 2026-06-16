"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCardSearchStore } from "@/store/cardSearchStore";
import { CardGrid } from "./CardGrid";
import { CardZoomModal } from "./CardZoomModal";
import type { PokeTCGSet } from "@/types/pokemontcg";


const POKEMON_TYPES = ["Fire", "Water", "Grass", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Dragon", "Colorless"];
const ALL_SUPERTYPES = ["Pokémon", "Trainer", "Energy"];
const RARITIES = [
  "Common", "Uncommon", "Rare", "Rare Holo",
  "Double Rare", "Ultra Rare", "Illustration Rare",
  "Special Illustration Rare", "Hyper Rare",
  "ACE SPEC Rare", "Radiant Rare", "Promo",
];
const SORT_OPTIONS: { value: "newest" | "name" | "number"; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name" },
  { value: "number", label: "Number" },
];

function SetPicker({ sets, value, onChange }: { sets: PokeTCGSet[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = filter
    ? sets.filter((s) =>
        s.name.toLowerCase().includes(filter.toLowerCase()) ||
        s.series.toLowerCase().includes(filter.toLowerCase())
      )
    : sets;

  const selectedSet = sets.find((s) => s.id === value);

  useEffect(() => {
    if (!open) { setFilter(""); return; }
    setTimeout(() => inputRef.current?.focus(), 0);
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs hover:border-white/20 focus:outline-none transition-colors"
      >
        <span className={`truncate ${selectedSet ? "text-white/80" : "text-white/35"}`}>
          {selectedSet ? selectedSet.name : "All sets"}
        </span>
        <svg
          className={`w-3 h-3 text-white/40 flex-shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#141c2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/5">
            <input
              ref={inputRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter sets…"
              className="w-full bg-white/5 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto max-h-52">
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/5 ${!value ? "text-white font-medium" : "text-white/50"}`}
            >
              All sets
            </button>
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => { onChange(s.id); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/5 truncate ${value === s.id ? "text-indigo-300 font-medium" : "text-white/55"}`}
              >
                {s.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-white/30 text-center">No sets found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CardSearchPanel() {
  const {
    query, setQuery, fetchResults, loadMore, results, isLoading, totalCount,
    selectedTypes, setSelectedTypes, selectedSetId, setSelectedSetId,
    supertypes, setSupertypes, rarity, setRarity,
    sortOrder, setSortOrder,
    sets, loadSets,
    ownedCardIds, loadOwnedCards,
  } = useCardSearchStore();

  const [zoom, setZoom] = useState<{ cardId: string; cardName: string; cardImageSmall: string } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ownedSet = useMemo(() => new Set(ownedCardIds), [ownedCardIds]);

  useEffect(() => {
    fetchResults();
    loadSets();
    loadOwnedCards();
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

  function toggleSupertype(st: string) {
    // Don't allow deselecting the last one
    if (supertypes.includes(st) && supertypes.length === 1) return;
    const next = supertypes.includes(st)
      ? supertypes.filter((s) => s !== st)
      : [...supertypes, st];
    setSupertypes(next);
    trigger(100);
  }

  function toggleType(type: string) {
    setSelectedTypes(selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [type]);
    trigger(100);
  }

  function handleSetChange(setId: string) {
    // When browsing a specific set, show all card types and default to number order
    if (setId) {
      setSupertypes(ALL_SUPERTYPES);
      setSortOrder("number");
    } else {
      setSortOrder("newest");
    }
    setSelectedSetId(setId);
    trigger(100);
  }

  function handleRarityChange(r: string) {
    setRarity(r);
    trigger(100);
  }

  function handleSortChange(s: "newest" | "name" | "number") {
    setSortOrder(s);
    trigger(100);
  }

  const onlyPokemon = supertypes.length === 1 && supertypes[0] === "Pokémon";

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

        {/* Supertype multi-select — click to toggle, at least one must remain active */}
        <div className="flex gap-1">
          {ALL_SUPERTYPES.map((st) => (
            <button
              key={st}
              onClick={() => toggleSupertype(st)}
              className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium border transition-colors ${
                supertypes.includes(st)
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Pokémon type filters — only shown when exclusively browsing Pokémon */}
      {onlyPokemon && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="flex flex-wrap gap-1">
            {POKEMON_TYPES.map((type) => (
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
          <SetPicker sets={sets} value={selectedSetId} onChange={handleSetChange} />
        </div>
      )}

      {/* Rarity filter */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="flex flex-wrap gap-1">
          {RARITIES.map((r) => (
            <button
              key={r}
              onClick={() => handleRarityChange(rarity === r ? "" : r)}
              className={`rounded-md px-2 py-0.5 text-[10px] transition-colors ${
                rarity === r
                  ? "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border border-transparent"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Sort order */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/30 shrink-0 mr-0.5">Sort</span>
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleSortChange(value)}
              className={`flex-1 rounded-md py-1 text-[10px] border transition-colors ${
                sortOrder === value
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                  : "bg-white/5 border-transparent text-white/40 hover:text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

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

      <CardGrid
        cards={results}
        isLoading={isLoading}
        hasMore={results.length < totalCount}
        onLoadMore={loadMore}
        emptyMessage={query ? `No results for "${query}"` : "No cards found"}
        onZoom={(cardId, cardName, cardImageSmall) => setZoom({ cardId, cardName, cardImageSmall })}
        ownedCardIds={ownedSet}
      />

      <CardZoomModal
        cardId={zoom?.cardId ?? null}
        cardName={zoom?.cardName ?? ""}
        cardImageSmall={zoom?.cardImageSmall ?? ""}
        onClose={() => setZoom(null)}
      />
    </div>
  );
}
