// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "./logger";
import { runWithRequestContext, setRequestUserId } from "./requestContext";

afterEach(() => vi.restoreAllMocks());

describe("logger", () => {
  it("writes a structured JSON line with level, message, and fields", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("hello", { foo: "bar" });
    expect(spy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry).toMatchObject({ level: "info", message: "hello", foo: "bar" });
    expect(typeof entry.time).toBe("string");
  });

  it("routes warn and error to their console methods", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.warn("w");
    logger.error("e");
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it("omits requestId/userId when there is no request context", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("no-ctx");
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry).not.toHaveProperty("requestId");
    expect(entry).not.toHaveProperty("userId");
  });

  it("enriches lines with the active request context", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    runWithRequestContext({ requestId: "req-1" }, () => {
      setRequestUserId("user-9");
      logger.info("in-ctx");
    });
    const entry = JSON.parse(spy.mock.calls.at(-1)![0] as string);
    expect(entry).toMatchObject({ requestId: "req-1", userId: "user-9" });
  });
});
