// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import type { Session } from "next-auth";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth/next";
import { ApiError, parseBody, parseQuery, requireUserId, withApiHandler } from "./api";

const getSession = vi.mocked(getServerSession);

function postRequest(body: unknown): Request {
  return new Request("http://test/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("requireUserId", () => {
  beforeEach(() => getSession.mockReset());

  it("returns the user id when authenticated", async () => {
    getSession.mockResolvedValue({ user: { id: "user_1" }, expires: "" } as Session);
    await expect(requireUserId()).resolves.toBe("user_1");
  });

  it("throws a 401 ApiError when unauthenticated", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireUserId()).rejects.toMatchObject({ status: 401 });
  });
});

describe("parseBody", () => {
  const schema = z.object({ name: z.string() });

  it("returns parsed data for a valid body", async () => {
    await expect(parseBody(postRequest({ name: "ok" }), schema)).resolves.toEqual({ name: "ok" });
  });

  it("throws 400 when the body does not match the schema", async () => {
    await expect(parseBody(postRequest({ name: 123 }), schema)).rejects.toMatchObject({ status: 400 });
  });

  it("throws 400 when the body is not valid JSON", async () => {
    const req = new Request("http://test/api", { method: "POST", body: "{bad json" });
    await expect(parseBody(req, schema)).rejects.toMatchObject({ status: 400 });
  });
});

describe("parseQuery", () => {
  const schema = z.object({ page: z.coerce.number().int().min(1) });

  it("parses and coerces query params", () => {
    expect(parseQuery(new Request("http://test/api?page=3"), schema)).toEqual({ page: 3 });
  });

  it("throws a 400 ApiError for invalid query params", () => {
    expect(() => parseQuery(new Request("http://test/api?page=0"), schema)).toThrow(ApiError);
  });
});

describe("withApiHandler", () => {
  it("returns the handler's response on success", async () => {
    const handler = withApiHandler(async () => Response.json({ ok: true }));
    const res = await handler(new Request("http://test/api"), undefined);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("maps an ApiError to its status and message", async () => {
    const handler = withApiHandler(async () => {
      throw new ApiError(404, "Not found");
    });
    const res = await handler(new Request("http://test/api"), undefined);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Not found" });
  });

  it("maps a ZodError to 400", async () => {
    const handler = withApiHandler(async () => {
      z.object({ a: z.string() }).parse({});
      return Response.json({});
    });
    const res = await handler(new Request("http://test/api"), undefined);
    expect(res.status).toBe(400);
  });

  it("maps an unexpected error to a generic 500 without leaking details", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = withApiHandler(async () => {
      throw new Error("internal secret detail");
    });
    const res = await handler(new Request("http://test/api"), undefined);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Internal server error" });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
