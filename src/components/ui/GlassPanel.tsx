import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function GlassPanel({ children, className }: Props) {
  return (
    <div className={cn("glass rounded-2xl", className)}>
      {children}
    </div>
  );
}
