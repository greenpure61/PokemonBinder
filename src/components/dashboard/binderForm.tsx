"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted">{label}</label>
      {children}
    </div>
  );
}

export function ColorSwatches({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (c: string) => void;
  colors: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Cover color ${c}`}
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          style={{ background: c }}
          className={cn(
            "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-transform",
            value === c
              ? "scale-105 ring-2 ring-primary ring-offset-2 ring-offset-surface"
              : "hover:scale-105"
          )}
        >
          {value === c && <Check className="h-4 w-4 text-white" />}
        </button>
      ))}
    </div>
  );
}
