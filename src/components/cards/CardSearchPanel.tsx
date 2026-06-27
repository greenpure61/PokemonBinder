"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { useCardSearchStore } from "@/store/cardSearchStore";
import { CardGrid } from "./CardGrid";
import { CardZoomModal } from "./CardZoomModal";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import type { PokeTCGSet } from "@/types/pokemontcg";

const POKEMON_TYPES = ["Fire", "Water", "Grass", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Dragon", "Colorless"];
const ALL_SUPERTYPES = ["Pokémon", "Trainer", "Energy"];
const SORT_OPTIONS: { value: "newest" | "name" | "number"; label: string }[] = [
  // "Newest" is omitted: TCGdex's /cards endpoint can't sort by release date.
  { value: "number", label: "Number" },
  { value: "name", label: "Name" },
];
const LANGUAGES: { value: "en" | "ja"; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
];

function SetPicker({
  sets,
  value,
  onChange,
  getDisplayName,
}: {
  sets: PokeTCGSet[];
  value: string;
  onChange: (id: string) => void;
  getDisplayName?: (s: PokeTCGSet) => string;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = (s: PokeTCGSet) => getDisplayName?.(s) ?? s.name;

  // Some TCGdex language lists repeat set IDs; dedupe so React keys stay unique.
  const uniqueSets = useMemo(() => {
    const seen = new Set<string>();
    return sets.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  }, [sets]);

  const filtered = filter
    ? uniqueSets.filter((s) => {
        const f = filter.toLowerCase();
        return (
          displayName(s).toLowerCase().includes(f) ||
          s.name.toLowerCase().includes(f) ||
          s.series.toLowerCase().includes(f)
        );
      })
    : uniqueSets;

  const selectedSet = sets.find((s) => s.id === value);

  // Clear the filter when the dropdown closes (render-phase, not an effect).
  const [trackedOpen, setTrackedOpen] = useState(open);
  if (open !== trackedOpen) {
    setTrackedOpen(open);
    if (!open) setFilter("");
  }

  useEffect(() => {
    if (!open) return;
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
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-surface px-2.5 py-2 text-xs transition-colors hover:border-border-strong"
      >
        <span className={cn("truncate", selectedSet ? "text-foreground" : "text-subtle")}>
          {selectedSet ? displayName(selectedSet) : "All sets"}
        </span>
        <ChevronDown className={cn("ml-2 h-3.5 w-3.5 flex-shrink-0 text-subtle transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-2">
            <input
              ref={inputRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter sets…"
              className="w-full rounded-lg bg-surface-muted px-2.5 py-1.5 text-xs text-foreground placeholder:text-subtle focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={cn(
                "w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-surface-muted",
                !value ? "font-semibold text-foreground" : "text-muted"
              )}
            >
              All sets
            </button>
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onChange(s.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full truncate px-3 py-1.5 text-left text-xs transition-colors hover:bg-surface-muted",
                  value === s.id ? "font-semibold text-primary" : "text-muted"
                )}
              >
                {displayName(s)}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-3 text-center text-xs text-subtle">No sets found</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact single-select dropdown for short option lists (types, rarities).
// Keeps the long option list inside a scrollable popover instead of a pill wall.
function FilterMenu({
  allLabel,
  value,
  options,
  onChange,
  active = "primary",
  className,
}: {
  allLabel: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  active?: "primary" | "accent";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const selectedTrigger =
    active === "accent"
      ? "border-accent bg-accent-soft text-accent-foreground"
      : "border-primary bg-primary-soft text-primary";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors",
          value ? selectedTrigger : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground"
        )}
      >
        <span className="truncate">{value || allLabel}</span>
        <ChevronDown className={cn("ml-1.5 h-3.5 w-3.5 flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg">
          <button
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={cn(
              "w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-surface-muted",
              !value ? "font-semibold text-foreground" : "text-muted"
            )}
          >
            {allLabel}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "w-full truncate px-3 py-1.5 text-left text-xs transition-colors hover:bg-surface-muted",
                value === opt ? "font-semibold text-primary" : "text-muted"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CardSearchPanel() {
  const {
    query, setQuery, fetchResults, loadMore, results, isLoading, totalCount, hasMore,
    language, setLanguage,
    selectedTypes, setSelectedTypes, selectedSetId, setSelectedSetId,
    supertypes, setSupertypes, rarity, setRarity,
    sortOrder, setSortOrder,
    sets, loadSets, rarities, loadRarities,
    enSetNames, loadEnSetNames,
    ownedCardIds, loadOwnedCards,
  } = useCardSearchStore();

  const [zoom, setZoom] = useState<{ cardId: string; cardName: string; cardImageSmall: string } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ownedSet = useMemo(() => new Set(ownedCardIds), [ownedCardIds]);

  // Search results from /cards carry no set details — fill in set names from the loaded set list.
  const setNameById = useMemo(() => new Map(sets.map((s) => [s.id, s.name])), [sets]);
  const enriched = useMemo(
    () =>
      results.map((c) =>
        c.set.name || !setNameById.has(c.set.id)
          ? c
          : { ...c, set: { ...c.set, name: setNameById.get(c.set.id) ?? "" } }
      ),
    [results, setNameById]
  );

  // Set completion — count owned cards whose id belongs to the selected set
  const setCompletion = useMemo(() => {
    if (!selectedSetId) return null;
    const set = sets.find((s) => s.id === selectedSetId);
    if (!set) return null;
    const total = set.total || set.printedTotal || 0;
    if (!total) return null;
    const prefix = `${selectedSetId}-`;
    const owned = ownedCardIds.filter((id) => id.startsWith(prefix)).length;
    return { owned: Math.min(owned, total), total, pct: Math.min(100, Math.round((owned / total) * 100)) };
  }, [selectedSetId, sets, ownedCardIds]);

  // Initial load on mount. These are Zustand actions with stable identities,
  // so listing them as deps satisfies exhaustive-deps without re-running.
  useEffect(() => {
    fetchResults();
    loadSets();
    loadRarities();
    loadOwnedCards();
  }, [fetchResults, loadSets, loadRarities, loadOwnedCards]);

  function handleLanguageChange(l: "en" | "ja") {
    if (l === language) return;
    setLanguage(l);
    loadSets();
    loadRarities();
    if (l === "ja") loadEnSetNames(); // for translating the set picker
    trigger(0);
  }

  // While browsing Japanese, show English set names where an English release shares the set id.
  const setDisplayName = language === "ja" ? (s: PokeTCGSet) => enSetNames[s.id] ?? s.name : undefined;

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
    const next = supertypes.includes(st) ? supertypes.filter((s) => s !== st) : [...supertypes, st];
    setSupertypes(next);
    trigger(100);
  }

  function selectType(type: string) {
    // Empty string clears the type filter; otherwise single-select.
    setSelectedTypes(type ? [type] : []);
    trigger(100);
  }

  function handleSetChange(setId: string) {
    // When browsing a specific set, show all card types and default to number order
    if (setId) {
      setSupertypes(ALL_SUPERTYPES);
      setSortOrder("number");
    } else {
      setSortOrder("number");
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
    <div className="flex h-full flex-col">
      {/* Header + search */}
      <div className="flex-shrink-0 space-y-2 px-3 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Card library</p>
          {/* Language toggle */}
          <div className="flex gap-0.5 rounded-lg bg-surface-muted p-0.5">
            {LANGUAGES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleLanguageChange(value)}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors",
                  language === value ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search cards…"
            className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-8 text-xs text-foreground placeholder:text-subtle transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-subtle transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Supertype multi-select — click to toggle, at least one must remain active */}
        <div className="flex gap-1">
          {ALL_SUPERTYPES.map((st) => (
            <button
              key={st}
              onClick={() => toggleSupertype(st)}
              className={cn(
                "flex-1 cursor-pointer rounded-lg border py-1.5 text-[11px] font-semibold transition-colors",
                supertypes.includes(st)
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Set filter */}
      {sets.length > 0 && (
        <div className="flex-shrink-0 px-3 pb-2">
          <SetPicker sets={sets} value={selectedSetId} onChange={handleSetChange} getDisplayName={setDisplayName} />

          {/* Set completion tracker */}
          {setCompletion && (
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] text-muted">Collected</span>
                <span className="text-[10px] font-medium text-foreground tabular-nums">
                  {setCompletion.owned}/{setCompletion.total} · {setCompletion.pct}%
                </span>
              </div>
              <Progress value={setCompletion.pct} className="h-1.5" barClassName="bg-success" />
            </div>
          )}
        </div>
      )}

      {/* Type + rarity filters as compact dropdowns (rarity hidden while a set is selected) */}
      {((onlyPokemon && language === "en") || (rarities.length > 0 && !selectedSetId)) && (
        <div className="flex flex-shrink-0 gap-1.5 px-3 pb-2">
          {onlyPokemon && language === "en" && (
            <FilterMenu
              className="flex-1"
              allLabel="All types"
              value={selectedTypes[0] ?? ""}
              options={POKEMON_TYPES}
              onChange={selectType}
            />
          )}
          {rarities.length > 0 && !selectedSetId && (
            <FilterMenu
              className="flex-1"
              allLabel="All rarities"
              value={rarity}
              options={rarities}
              onChange={handleRarityChange}
              active="accent"
            />
          )}
        </div>
      )}

      {/* Sort order */}
      <div className="flex-shrink-0 px-3 pb-2">
        <div className="flex items-center gap-1">
          <span className="mr-0.5 shrink-0 text-[10px] text-subtle">Sort</span>
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleSortChange(value)}
              className={cn(
                "flex-1 cursor-pointer rounded-md border py-1 text-[10px] font-medium transition-colors",
                sortOrder === value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-transparent bg-surface-muted text-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div className="h-5 flex-shrink-0 px-3 pb-1.5">
        {isLoading && results.length === 0 ? (
          <p className="text-xs text-subtle">Searching…</p>
        ) : totalCount > 0 ? (
          <p className="text-xs text-subtle">
            {totalCount.toLocaleString()} {totalCount === 1 ? "card" : "cards"}
          </p>
        ) : results.length > 0 ? (
          <p className="text-xs text-subtle">
            {results.length.toLocaleString()}
            {hasMore ? "+" : ""} {results.length === 1 ? "card" : "cards"}
          </p>
        ) : null}
      </div>

      <CardGrid
        cards={enriched}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        emptyMessage={query ? `No results for "${query}"` : "No cards found"}
        onZoom={(cardId, cardName, cardImageSmall) => setZoom({ cardId, cardName, cardImageSmall })}
        ownedCardIds={ownedSet}
      />

      <CardZoomModal
        cardId={zoom?.cardId ?? null}
        cardName={zoom?.cardName ?? ""}
        cardImageSmall={zoom?.cardImageSmall ?? ""}
        lang={language}
        onClose={() => setZoom(null)}
      />
    </div>
  );
}
