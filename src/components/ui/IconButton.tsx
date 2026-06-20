"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "ghost" | "secondary" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
  secondary: "bg-surface border border-border text-foreground hover:bg-surface-muted",
  danger: "text-muted hover:bg-danger-soft hover:text-danger",
};

const sizes: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";
