import { logger, type LogFields } from "@/lib/logger";

// Central sink for unexpected errors. Today it logs the error with structured
// context (request id / user id come from the logger's request context). The
// `// seam:` comment marks the single place to forward to an external tracker
// (Sentry, Axiom, ...) once a provider/DSN is configured — see PRODUCTION.md.
export function reportError(error: unknown, context?: LogFields): void {
  const err = error instanceof Error ? error : new Error(String(error));

  logger.error(err.message, {
    ...context,
    errorName: err.name,
    stack: err.stack,
  });

  // seam: forward to an external error tracker here, e.g.
  //   Sentry.captureException(err, { extra: { ...context, ...getRequestContext() } });
  // Intentionally a no-op until a provider is wired up.
}
