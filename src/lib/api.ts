import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { ZodError, type ZodType, type z } from "zod";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/observability";
import { runWithRequestContext, setRequestUserId } from "@/lib/requestContext";

/**
 * An error with an associated HTTP status. Throw this from a route handler (or
 * a helper it calls) and `withApiHandler` turns it into a JSON error response.
 */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

/** Returns the authenticated user's id, or throws a 401 ApiError. */
export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new ApiError(401, "Unauthorized");
  setRequestUserId(session.user.id);
  return session.user.id;
}

/** Parses + validates a JSON request body, throwing a 400 ApiError on failure. */
export async function parseBody<S extends ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw new ApiError(400, formatZodError(result.error));
  return result.data;
}

/** Parses + validates the query string, throwing a 400 ApiError on failure. */
export function parseQuery<S extends ZodType>(req: Request, schema: S): z.infer<S> {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const result = schema.safeParse(params);
  if (!result.success) throw new ApiError(400, formatZodError(result.error));
  return result.data;
}

type RouteHandler<C> = (req: Request, ctx: C) => Promise<Response> | Response;

function jsonError(message: string, status: number, requestId: string): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: { "x-request-id": requestId } });
}

/**
 * Wraps a route handler with consistent error handling and observability:
 * - establishes a per-request context (request id, later the user id) so logs
 *   are correlated,
 * - logs every request's outcome (method, path, status, latency),
 * - maps ApiError / ZodError to their status codes, and reports anything
 *   unexpected via `reportError` before returning a generic 500 (no internals
 *   leaked to the client).
 */
export function withApiHandler<C = unknown>(handler: RouteHandler<C>): RouteHandler<C> {
  return (req, ctx) => {
    const requestId = crypto.randomUUID();
    return runWithRequestContext({ requestId }, async () => {
      const start = Date.now();
      const method = req.method;
      const path = new URL(req.url).pathname;

      try {
        const res = await handler(req, ctx);
        try {
          res.headers.set("x-request-id", requestId);
        } catch {
          // Some Response instances have immutable headers; correlation id is best-effort.
        }
        logger.info("request.completed", { method, path, status: res.status, ms: Date.now() - start });
        return res;
      } catch (err) {
        const ms = Date.now() - start;

        if (err instanceof ApiError) {
          logger.warn("request.failed", { method, path, status: err.status, ms, error: err.message });
          return jsonError(err.message, err.status, requestId);
        }
        if (err instanceof ZodError) {
          const message = formatZodError(err);
          logger.warn("request.failed", { method, path, status: 400, ms, error: message });
          return jsonError(message, 400, requestId);
        }

        reportError(err, { method, path, status: 500, ms });
        return jsonError("Internal server error", 500, requestId);
      }
    });
  };
}
