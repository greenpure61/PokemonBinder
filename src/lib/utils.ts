import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BinderLayout } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSlotsPerPage(layout: BinderLayout): number {
  switch (layout) {
    case "FOUR_POCKET": return 4;
    case "NINE_POCKET": return 9;
    case "TWELVE_POCKET": return 12;
  }
}

export function getGridCols(layout: BinderLayout): number {
  switch (layout) {
    case "FOUR_POCKET": return 2;
    case "NINE_POCKET": return 3;
    case "TWELVE_POCKET": return 4;
  }
}

export function getGridRows(layout: BinderLayout): number {
  switch (layout) {
    case "FOUR_POCKET": return 2;
    case "NINE_POCKET": return 3;
    case "TWELVE_POCKET": return 3;
  }
}
