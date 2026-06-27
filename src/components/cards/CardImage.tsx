"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  /** Shown (as text) when there is no image, or the image fails to load. */
  name: string;
  sizes: string;
  className?: string;
  /** Extra classes for the placeholder container (e.g. background, rounding). */
  placeholderClassName?: string;
  /** Classes for the placeholder text. Defaults to a thumbnail-sized label. */
  nameClassName?: string;
  priority?: boolean;
  draggable?: boolean;
}

/**
 * A fill <Image> for card art that gracefully degrades to a name placeholder.
 * Card images can be missing (TCGdex has no art for some promos) or point at a
 * derived PokéTCG fallback URL that 404s — either way the user sees the card's
 * name rather than a broken image. Parent must be positioned (`relative`).
 */
export function CardImage({
  src,
  alt,
  name,
  sizes,
  className,
  placeholderClassName,
  nameClassName,
  priority,
  draggable,
}: Props) {
  // Track the specific src that failed so a new src re-attempts to load.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center p-1.5 text-center", placeholderClassName)}>
        <span className={cn("leading-tight text-muted", nameClassName ?? "text-[10px]")}>{name}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      draggable={draggable}
      priority={priority}
      onError={() => setFailedSrc(src)}
    />
  );
}
