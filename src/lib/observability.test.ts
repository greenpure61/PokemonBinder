// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { reportError } from "./observability";

afterEach(() => vi.restoreAllMocks());

describe("reportError", () => {
  it("logs an error with its name, stack, and extra context", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    reportError(new Error("boom"), { route: "/x" });
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry).toMatchObject({
      level: "error",
      message: "boom",
      route: "/x",
      errorName: "Error",
    });
    expect(entry.stack).toContain("boom");
  });

  it("normalizes non-Error values into a message", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    reportError("just a string");
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry.message).toBe("just a string");
  });
});
