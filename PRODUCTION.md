# Production Readiness Plan

A sequenced plan to make PokemonBinder production-ready. Phases are ordered by
leverage — **Phase 0 → 1** deliver ~80% of the real-world risk reduction; the
rest is polish that can be staged incrementally.

Rough total: **3–4 focused days.**

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 0 — Foundations (safety net first) · ~half day · ✅ DONE

Do this before touching app code so everything after is verifiable.

- [x] **Test harness** — Vitest + `@testing-library/react` (jsdom env,
      `vitest.config.mts` + `vitest.setup.ts`). Added `test`, `test:watch`, and
      `typecheck` scripts to `package.json`.
- [x] **CI** — `.github/workflows/ci.yml`: install → prisma generate → lint →
      typecheck → test → `next build`, on PR + push to `master`.
- [x] **First tests** for pure logic with the most branching and zero mocking cost:
  - [x] `lib/pokemontcg.ts` — `setIdFromCardId`, `isPocketSetId`,
        `isPocketRarity`, `normalizeSet/Full`, `sortByNumber` (`pokemontcg.test.ts`).
  - [x] `lib/utils.ts` — `getSlotsPerPage`, `getGridCols`, `getGridRows`, `cn`
        (`utils.test.ts`).
- [x] **Bonus:** made `prisma.config.ts` tolerant of a missing `.env.local` so
      Prisma CLI commands work in CI / on deploy platforms (was an unconditional
      `process.loadEnvFile` that threw without the file).

_Verified locally: 23 tests pass, `typecheck` clean, `lint` clean (1 pre-existing
warning), `next build` green._

## Phase 1 — Harden the API layer · ~1–1.5 days · ✅ DONE

Highest-leverage correctness + security work. ~13 route files in `src/app/api`.
Shared helpers live in `src/lib/api.ts` (`withApiHandler`, `requireUserId`,
`parseBody`, `parseQuery`, `ApiError`) and schemas in `src/lib/schemas.ts`.

- [x] **Runtime input validation with zod** — schemas for every request body and
      the card-search query string:
  - [x] `slots` route — validates the array, each `slotIndex`, and card fields.
  - [x] `binders` POST — validates `name`, `pocketLayout` (enum), `pageCount`,
        `coverColor` (hex); `binders/[id]` PUT validated too.
  - [x] wishlist POST — validated.
  - [x] `cards/search` query — coerced/bounded `page`/`pageSize`, enum `orderBy`
        (incl. `newest`) and `lang`.
- [x] **Bound + transaction the slots write** — capped at 12 slots, each
      `slotIndex` checked against the binder's actual layout (`getSlotsPerPage`),
      duplicates rejected, and all upserts run in a single `prisma.$transaction`.
- [x] **Shared error handling** — every route wrapped with `withApiHandler`:
      ApiError → its status, ZodError → 400, unexpected → logged + generic 500
      (no internals leaked). Replaces the previous raw stack-trace 500s.
- [x] **Env validation at boot** — `src/lib/env.ts` (zod) asserts `DATABASE_URL`,
      `GOOGLE_CLIENT_ID/SECRET`, `NEXTAUTH_SECRET` (`NEXTAUTH_URL` optional);
      wired into `prisma.ts` + `auth.ts`. Fails fast with a clear message.
- [x] **Tests** — `src/lib/api.test.ts` (auth/parse/error-mapping) and
      `src/lib/schemas.test.ts` (validation bounds). 56 tests total.

_Verified locally: 56 tests pass, `typecheck` clean, `lint` clean, `next build`
green. Confirmed all frontend payloads (cover colors, page counts, sort orders,
wishlist/slot bodies) still pass the new validation._

> Note: full cross-user 404 ownership tests would require mocking Prisma + the
> whole route; deferred in favor of testing the shared building blocks. The
> ownership `where` clauses are unchanged from the prior (working) routes.

## Phase 2 — Abuse & resource protection · ~half day

- [ ] **Rate limiting** on the card proxy routes (`cards/search`, `cards/sets`,
      `cards/rarities`, `cards/[cardId]`) — each request fans out to TCGdex.
      Per-user/IP limiter (Upstash Ratelimit, or in-memory if single-instance).
- [ ] **Payload caps** on mutation routes (max binder pages, max slots per
      request) — partly covered in Phase 1.

## Phase 3 — Observability · ~half day · ✅ DONE

Chosen approach: **provider-agnostic seam** (no external SaaS yet) — structured
logging now, with a single hook ready to forward to Sentry/Axiom/etc.

- [x] **Structured logging** for route handlers — `withApiHandler` establishes a
      per-request context (`src/lib/requestContext.ts`, via `AsyncLocalStorage`)
      and logs every request's outcome (`method`, `path`, `status`, latency `ms`)
      with a `requestId` and the authenticated `userId`. Logger emits one JSON
      object per line (`src/lib/logger.ts`); responses carry an `x-request-id`
      header for correlation.
- [x] **Error tracking seam** — unexpected errors go through `reportError`
      (`src/lib/observability.ts`), which logs with full context today and has a
      marked `// seam:` for forwarding to an external tracker once a provider/DSN
      is configured. Client-side error capture is deferred until a provider is
      wired (it needs that SDK).
- [x] **Tests** — `logger.test.ts` + `observability.test.ts`; `api.test.ts`
      extended for the `x-request-id` header. 56 → 63 tests.

_Verified locally: 63 tests pass, `typecheck` clean, `lint` clean, `next build`
green._

> To activate an external tracker later: pick a provider, add its SDK + DSN env,
> and fill in the `// seam:` in `observability.ts` (plus a client SDK init for
> browser errors). The logging/context plumbing is already in place.

## Phase 4 — Hardening & hygiene · ~half day · ✅ DONE

- [x] **Security headers** in `next.config.ts` (applied to all routes): HSTS,
      `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
      `Permissions-Policy`, and a baseline CSP (`base-uri`, `object-src 'none'`,
      `frame-ancestors 'none'`). A strict nonce-based `script-src`/`style-src`
      CSP is deliberately deferred — it needs a `proxy.ts` (Next 16) + browser
      testing against framer-motion / recharts / html2canvas inline styles.
- [x] **Trim `images.remotePatterns`** — dropped `images.pokemontcg.io` and
      `images.scrydex.com`; kept `assets.tcgdex.net` (card art) and
      `lh3.googleusercontent.com` (Google avatars). Verified via a read-only DB
      query that **zero** stored images reference the removed hosts.
- [x] **Deployment docs** — added `.env.example` (matches `src/lib/env.ts`) and
      refreshed the README's Prerequisites / Setup / Scripts / Deployment
      sections (removed the stale `POKEMONTCG_API_KEY`, corrected the data
      source to TCGdex, documented `prisma migrate deploy` + CI).
- [x] **DB indexing review** — existing `@@index`es cover the hot paths
      (`Binder.userId`, `BinderPage.binderId`, `CardSlot.pageId`,
      `WishlistItem.userId`). No new index added: the per-binder/owned-card/stats
      aggregations filter `CardSlot.cardId IS NOT NULL` after joining via the
      `pageId` index, and at current scale a partial index would be premature.
- [x] **CI hygiene** — bumped `actions/checkout` and `actions/setup-node` to v5,
      clearing the Node 20 runner deprecation warning.

_Verified locally: 63 tests pass, `typecheck` clean, `lint` clean, `next build`
green (security headers + trimmed image hosts confirmed in the build config)._

---

## Deliberate non-goals (for now)

- Switching auth strategy.
- Multi-region / scaling work.
- E2E (Playwright) tests — hold until the above is in place.
