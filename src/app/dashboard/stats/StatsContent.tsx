"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface StatsData {
  totalCards: number;
  totalBinders: number;
  bySet: { set: string; count: number }[];
  binders: {
    id: string;
    name: string;
    pageCount: number;
    pocketLayout: string;
    coverColor: string;
  }[];
}

const SLOTS_PER_PAGE: Record<string, number> = {
  FOUR_POCKET: 4,
  NINE_POCKET: 9,
  TWELVE_POCKET: 12,
};

const BAR_COLORS = [
  "#818cf8", "#a78bfa", "#c084fc", "#e879f9",
  "#f472b6", "#fb7185", "#fb923c", "#fbbf24",
  "#a3e635", "#34d399",
];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

export function StatsContent() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
      </div>
    );
  }

  const totalSlots = data?.binders.reduce(
    (sum, b) => sum + b.pageCount * (SLOTS_PER_PAGE[b.pocketLayout] ?? 9),
    0
  ) ?? 0;
  const fillPct = totalSlots > 0 ? Math.round(((data?.totalCards ?? 0) / totalSlots) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-semibold text-white">Collection Stats</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Cards" value={data?.totalCards ?? 0} />
          <StatCard label="Total Binders" value={data?.totalBinders ?? 0} />
          <StatCard label="Slots Filled" value={`${fillPct}%`} sub={`${data?.totalCards ?? 0} / ${totalSlots}`} />
          <StatCard label="Unique Sets" value={data?.bySet.length ?? 0} />
        </div>

        {/* Top sets chart */}
        {(data?.bySet.length ?? 0) > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-medium text-white mb-6">Cards by Set (top {data!.bySet.length})</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data!.bySet}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="set"
                  width={120}
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{ background: "#0f1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                  itemStyle={{ color: "rgba(255,255,255,0.5)" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data!.bySet.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Per-binder fill rates */}
        {(data?.binders.length ?? 0) > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-medium text-white mb-4">Binders</h2>
            <div className="space-y-3">
              {data!.binders.map((b) => {
                const slots = b.pageCount * (SLOTS_PER_PAGE[b.pocketLayout] ?? 9);
                return (
                  <Link
                    key={b.id}
                    href={`/binder/${b.id}`}
                    className="flex items-center gap-3 hover:bg-white/3 rounded-xl p-2 -mx-2 transition-colors"
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: b.coverColor }} />
                    <span className="text-sm text-white/70 flex-1 truncate">{b.name}</span>
                    <span className="text-xs text-white/30 tabular-nums">{slots} slots</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {data?.totalCards === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">
            Add cards to your binders to see stats here.
          </div>
        )}
      </main>
    </div>
  );
}
