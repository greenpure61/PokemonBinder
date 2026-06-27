import { AsyncLocalStorage } from "node:async_hooks";

// Per-request context carried implicitly through the async call tree so the
// logger can enrich every line with a request id (and user id, once known)
// without threading them through every function signature.
export interface RequestContext {
  requestId: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Attaches the authenticated user id to the active request context, if any. */
export function setRequestUserId(userId: string): void {
  const ctx = storage.getStore();
  if (ctx) ctx.userId = userId;
}
