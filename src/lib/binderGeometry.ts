import type { BinderLayout } from "@prisma/client";
import { getGridCols, getGridRows } from "./utils";

export const PAGE_W = 2.6;
export const PAGE_H = 3.5;
export const SPINE_W = 0.45;
export const COVER_OVERHANG = 0.1;
export const COVER_THICK = 0.07;
export const COVER_W = PAGE_W + COVER_OVERHANG;
export const COVER_H = PAGE_H + COVER_OVERHANG;

export const LEFT_PAGE_X = -(SPINE_W / 2 + PAGE_W / 2);
export const RIGHT_PAGE_X = SPINE_W / 2 + PAGE_W / 2;

export interface SlotPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getSlotPositions(layout: BinderLayout): SlotPosition[] {
  const cols = getGridCols(layout);
  const rows = getGridRows(layout);
  const padding = 0.12;
  const gap = 0.04;
  const availW = PAGE_W - padding * 2;
  const availH = PAGE_H - padding * 2;
  const cardW = (availW - gap * (cols - 1)) / cols;
  const cardH = (availH - gap * (rows - 1)) / rows;

  const positions: SlotPosition[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push({
        x: -availW / 2 + cardW / 2 + col * (cardW + gap),
        y: availH / 2 - cardH / 2 - row * (cardH + gap),
        w: cardW,
        h: cardH,
      });
    }
  }
  return positions;
}
