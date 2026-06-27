import { describe, it, expect } from "vitest";
import { BinderLayout } from "@prisma/client";
import { cn, getSlotsPerPage, getGridCols, getGridRows } from "./utils";

describe("getSlotsPerPage", () => {
  it("returns the slot count for each layout", () => {
    expect(getSlotsPerPage(BinderLayout.FOUR_POCKET)).toBe(4);
    expect(getSlotsPerPage(BinderLayout.NINE_POCKET)).toBe(9);
    expect(getSlotsPerPage(BinderLayout.TWELVE_POCKET)).toBe(12);
  });

  it("equals cols * rows for every layout", () => {
    for (const layout of Object.values(BinderLayout)) {
      expect(getSlotsPerPage(layout)).toBe(getGridCols(layout) * getGridRows(layout));
    }
  });
});

describe("getGridCols / getGridRows", () => {
  it("returns the grid dimensions for each layout", () => {
    expect([getGridCols(BinderLayout.FOUR_POCKET), getGridRows(BinderLayout.FOUR_POCKET)]).toEqual([2, 2]);
    expect([getGridCols(BinderLayout.NINE_POCKET), getGridRows(BinderLayout.NINE_POCKET)]).toEqual([3, 3]);
    expect([getGridCols(BinderLayout.TWELVE_POCKET), getGridRows(BinderLayout.TWELVE_POCKET)]).toEqual([4, 3]);
  });
});

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("merges conflicting tailwind classes, keeping the last", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
