import { getRequestContext } from "@/lib/requestContext";

// Minimal structured logger. Emits one JSON object per line so platform log
// drains (Vercel, etc.) can parse and filter them. Never log request bodies or
// other potentially sensitive payloads — only metadata.

type Level = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

function emit(level: Level, message: string, fields?: LogFields): void {
  const ctx = getRequestContext();
  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    // `JSON.stringify` drops keys whose value is `undefined`, so these simply
    // disappear when there's no active request context.
    requestId: ctx?.requestId,
    userId: ctx?.userId,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};
