import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { ZodError, type ZodType, type z } from "zod";
import { authOptions } from "@/lib/auth";

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

/**
 * Wraps a route handler with consistent error handling: ApiError and ZodError
 * map to their proper status codes, and anything unexpected is logged and
 * returned as a generic 500 (no internals leaked to the client).
 */
export function withApiHandler<C = unknown>(handler: RouteHandler<C>): RouteHandler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
      }
      console.error("[api] Unhandled error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
