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

## Phase 1 — Harden the API layer · ~1–1.5 days

Highest-leverage correctness + security work. ~13 route files in `src/app/api`.

- [ ] **Runtime input validation with zod** — schemas for every request body and
      route param. Known gaps:
  - [ ] `slots/route.ts:22` — `{ slots }` is destructured and `.map`-ed with no
        check; malformed/missing body throws a raw 500. Validate the array, each
        slot's `slotIndex`, and the card fields.
  - [ ] `binders/route.ts:50` — body cast to `CreateBinderInput` with no runtime
        check; validate `name`, `pocketLayout` (enum), `pageCount` (bounded int).
  - [ ] wishlist routes — same treatment.
- [ ] **Bound + transaction the slots write** — `slots/route.ts:24` fires an
      unbounded `Promise.all` of upserts. Cap the array length, validate each
      `slotIndex` against the page's layout (`getSlotsPerPage`), and wrap in
      `prisma.$transaction`.
- [ ] **Shared error handling** — no route has a `try/catch` today; failures leak
      stack-trace 500s. Add a `withApiHandler` wrapper (or per-route try/catch)
      returning consistent JSON: zod errors → 400, not-found → 404, unexpected →
      generic 500 (no internals leaked).
- [ ] **Env validation at boot** — replace ad-hoc `process.env.X!`
      (`auth.ts:10–11`, `prisma.ts:7`) with one validated `lib/env.ts` (zod)
      asserting `DATABASE_URL`, `GOOGLE_CLIENT_ID/SECRET`, `NEXTAUTH_SECRET`,
      `NEXTAUTH_URL`. Fail fast at startup.
- [ ] **Route tests** for validation + ownership paths (401 unauthenticated,
      404 cross-user access, 400 bad input).

## Phase 2 — Abuse & resource protection · ~half day

- [ ] **Rate limiting** on the card proxy routes (`cards/search`, `cards/sets`,
      `cards/rarities`, `cards/[cardId]`) — each request fans out to TCGdex.
      Per-user/IP limiter (Upstash Ratelimit, or in-memory if single-instance).
- [ ] **Payload caps** on mutation routes (max binder pages, max slots per
      request) — partly covered in Phase 1.

## Phase 3 — Observability · ~half day

- [ ] **Error tracking** (Sentry for Next.js, or equivalent) wired into the
      Phase 1 error wrapper so server 500s and client errors are captured.
- [ ] **Structured logging** for route handlers (request id, userId, latency).
      There is no API-layer logging today.

## Phase 4 — Hardening & hygiene · ~half day

- [ ] **Security headers** in `next.config.ts` (CSP, frame-ancestors,
      `Referrer-Policy`, HSTS). None are set today.
- [ ] **Trim `images.remotePatterns`** — `next.config.ts` still allows
      `images.pokemontcg.io` and `images.scrydex.com`, but the app moved to
      TCGdex (`pokemontcg.ts:6`). Drop the unused hosts.
- [ ] **Deployment docs** — `.env.example` + a short deploy/runbook in the README
      (`prisma migrate deploy`, required env vars).
- [ ] **DB indexing review** — confirm indexes back hot query paths (e.g. the
      per-binder slot count aggregation in `binders/route.ts:27`).

---

## Deliberate non-goals (for now)

- Switching auth strategy.
- Multi-region / scaling work.
- E2E (Playwright) tests — hold until the above is in place.
