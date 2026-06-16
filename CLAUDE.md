@AGENTS.md

# PokemonBinder

A web app for building virtual Pokémon TCG binders: create binders, browse the
PokéTCG card catalog, drag cards into pocket pages, track a wishlist, and view
collection stats.

## Commands

- `npm run dev` — start the dev server (Next.js + Turbopack) on http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint

Prisma: `npx prisma migrate dev` (apply/create migrations), `npx prisma generate`
(regenerate client after schema changes), `npx prisma studio` (inspect the DB).

## Stack

- **Next.js 16** (App Router, Turbopack) — see `@AGENTS.md`: this version has
  breaking changes from older Next.js, so check `node_modules/next/dist/docs/`
  before writing framework code.
- **React 19** + **TypeScript** + **TailwindCSS v4**
- **Prisma 7** + **PostgreSQL** via the `@prisma/adapter-pg` driver adapter
- **NextAuth v4** (Google OAuth, Prisma adapter)
- **Zustand** for client/editor state; **@tanstack/react-query** for server state
- **dnd-kit** for drag-and-drop; **framer-motion** for animation
- **PokéTCG API v2** (`api.pokemontcg.io`) for all card/set data

## Project layout

```
src/
  app/
    (auth)/login/          Login page
    dashboard/             Binder list, /wishlist, /stats
    binder/[binderId]/     Binder editor (private)
    b/[binderId]/          Public read-only binder view
    api/                   Route handlers (see below)
  components/
    binder/                Binder pages, card slots
    cards/                 Card search panel, grid, thumbnail, zoom modal
    dashboard/             Binder cards, create/edit modals
    layout/                Editor layout, sidebars, top nav
  store/                   Zustand stores (binderStore, cardSearchStore, uiStore)
  hooks/                   React Query hooks + autosave (useBinderPersist)
  lib/                     pokemontcg, prisma, auth, utils
  types/                   Shared TypeScript types
prisma/                    schema.prisma + migrations
```

## Key conventions

**API routes & authorization.** Every route handler authenticates with
`getServerSession(authOptions)` and returns 401 when there's no `session.user.id`.
All Prisma queries are scoped to the current user (`where: { userId: session.user.id }`,
or nested as `page: { binder: { userId } }`). New endpoints touching user data must
follow this pattern — never trust an ID from the client without an ownership check.

**Data model** (`prisma/schema.prisma`). `Binder` → `BinderPage[]` → `CardSlot[]`.
A `CardSlot` stores denormalized card fields (`cardId`, `cardName`, `cardImageSmall`,
`cardSet`) copied from the PokéTCG API — card data is not a local table. `WishlistItem`
is unique per `(userId, cardId)`. Card IDs follow PokéTCG's `{setId}-{number}` format
(e.g. `swsh1-1`), which is how set membership is derived.

**Binder layouts.** `FOUR_POCKET` (2×2), `NINE_POCKET` (3×3), `TWELVE_POCKET` (4×3).
Use the helpers in `src/lib/utils.ts` (`getSlotsPerPage`, `getGridCols`, `getGridRows`)
rather than hardcoding dimensions. The editor shows two pages per spread.

**State management.**
- `binderStore` (Zustand) holds the editor's working copy of the binder, tracks
  `isDirty`/`dirtyPageIds`, and applies optimistic slot edits.
- `useBinderPersist` debounces (1.5s) and autosaves dirty pages to
  `PUT /api/binders/[id]/pages/[pageId]/slots`. Slot mutations should go through
  `binderStore`, not direct fetches.
- `cardSearchStore` owns card-library search/filter/sort state and cached
  `sets` / `ownedCardIds` (loaded once per session via guard flags).
- Server data (binder list, single binder) is fetched with React Query hooks in
  `useBinderData.ts`; mutations invalidate the `["binders"]` / `["binder", id]` keys.

**PokéTCG access** (`src/lib/pokemontcg.ts`). All catalog calls go through this lib,
which builds Lucene `q` queries and sets `next: { revalidate }` for caching. The
client never calls the PokéTCG API directly — it goes through `/api/cards/*` routes.

**Styling.** Dark theme throughout (`#0a0e1a` background, `glass` utility for panels,
white/opacity text scale). Match the existing Tailwind idioms and component density.

## Working agreement

- **Ask before `git commit` / `git push`.** Show the planned changes and wait for
  approval first.
- Keep new code consistent with surrounding patterns (auth checks, store usage,
  Tailwind conventions) rather than introducing new approaches.
