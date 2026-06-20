"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Layers, LibraryBig, Percent, Boxes, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

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
  "#2563eb", "#3b82f6", "#60a5fa", "#0891b2", "#0e7490",
  "#f5b91e", "#f59e0b", "#16a34a", "#22c55e", "#8b5cf6",
];

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">{label}</p>
          <p className="text-2xl font-extrabold leading-tight text-foreground">{value}</p>
        </div>
      </div>
      {sub && <p className="mt-2 text-xs text-subtle">{sub}</p>}
    </Card>
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

  const totalSlots =
    data?.binders.reduce((sum, b) => sum + b.pageCount * (SLOTS_PER_PAGE[b.pocketLayout] ?? 9), 0) ?? 0;
  const fillPct = totalSlots > 0 ? Math.round(((data?.totalCards ?? 0) / totalSlots) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Collection stats</h1>
          <p className="mt-1 text-sm text-muted">An overview of everything across your binders.</p>
        </div>

        {loading ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-2xl" />
          </>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total cards" value={data?.totalCards ?? 0} icon={<Layers className="h-5 w-5" />} />
              <StatCard label="Total binders" value={data?.totalBinders ?? 0} icon={<LibraryBig className="h-5 w-5" />} />
              <StatCard
                label="Slots filled"
                value={`${fillPct}%`}
                sub={`${data?.totalCards ?? 0} / ${totalSlots}`}
                icon={<Percent className="h-5 w-5" />}
              />
              <StatCard label="Unique sets" value={data?.bySet.length ?? 0} icon={<Boxes className="h-5 w-5" />} />
            </div>

            {/* Top sets chart */}
            {(data?.bySet.length ?? 0) > 0 && (
              <Card className="p-6">
                <h2 className="mb-6 text-sm font-semibold text-foreground">Cards by set (top {data!.bySet.length})</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data!.bySet} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fill: "#5a6478", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="set"
                      width={120}
                      tick={{ fill: "#5a6478", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(15,23,42,0.04)" }}
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #e6e8ef",
                        borderRadius: 12,
                        fontSize: 12,
                        boxShadow: "0 6px 16px -4px rgba(15,23,42,0.12)",
                      }}
                      labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                      itemStyle={{ color: "#5a6478" }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {data!.bySet.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Per-binder list */}
            {(data?.binders.length ?? 0) > 0 && (
              <Card className="p-6">
                <h2 className="mb-4 text-sm font-semibold text-foreground">Binders</h2>
                <div className="space-y-1">
                  {data!.binders.map((b) => {
                    const slots = b.pageCount * (SLOTS_PER_PAGE[b.pocketLayout] ?? 9);
                    return (
                      <Link
                        key={b.id}
                        href={`/binder/${b.id}`}
                        className="group -mx-2 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-muted"
                      >
                        <div className="h-7 w-7 flex-shrink-0 rounded-lg" style={{ background: b.coverColor }} />
                        <span className="flex-1 truncate text-sm font-medium text-foreground">{b.name}</span>
                        <span className="text-xs text-muted tabular-nums">{slots} slots</span>
                        <ChevronRight className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    );
                  })}
                </div>
              </Card>
            )}

            {data?.totalCards === 0 && (
              <EmptyState
                icon={<Layers className="h-7 w-7" />}
                title="No cards yet"
                description="Add cards to your binders and your collection stats will appear here."
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
