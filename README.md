# PokemonBinder

A Pokémon card collection manager with drag-and-drop binder editing, card search, and full collection tracking.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript) ![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss)

---

## Features

### Binder Editor
- Two-page spread with drag-and-drop card placement (dnd-kit)
- Drag cards from the search panel directly into any slot
- Swap cards between slots by dragging one onto another
- Right-click any card for a context menu: **Add to Wishlist**, **View Card**, **Remove**
- Click to zoom into full card details
- Auto-saves after 1.5 seconds of inactivity

### Card Search
- Powered by the [TCGdex API](https://tcgdex.dev) (proxied server-side)
- Search by name with 400ms debounce
- Filter by type (Fire, Water, Grass, Lightning, …)
- Infinite scroll with intersection observer

### Collection Tools
- **Public share** — make any binder public and share a read-only link
- **Export as PNG** — download the current flat spread as a high-res image
- **Collection stats** — total cards, set breakdown chart, fill rate per binder
- **Wishlist** — save cards you want, view and manage them from the dashboard

### UI / UX
- Dark glassmorphism design with Tailwind CSS v4
- Animated collapsible sidebars with mobile overlay panels
- Inline binder name editing in the top bar
- User avatar dropdown with sign-out
- Framer Motion throughout — staggered dashboard grid, modal scale-in, sidebar slides
- Mobile-responsive: sidebars become slide-in overlay panels on small screens

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion v12 |
| Drag & Drop | dnd-kit |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma 7 |
| Auth | NextAuth.js v4 (Google OAuth) |
| State | Zustand v5 |
| Data Fetching | TanStack Query v5 |
| Charts | Recharts |
| Export | html2canvas |

---

## Getting Started

### Prerequisites
- Node.js 20+ (CI runs on 20)
- A [Neon](https://neon.tech) PostgreSQL database
- A Google OAuth app ([console.cloud.google.com](https://console.cloud.google.com))

> Card data comes from the public [TCGdex](https://tcgdex.dev) API — no API key required.

### Setup

```bash
git clone https://github.com/greenpure61/PokemonBinder.git
cd PokemonBinder
npm install
```

Copy the environment template and fill it in (every variable is validated at
startup by `src/lib/env.ts`):

```bash
cp .env.example .env.local
```

See [`.env.example`](./.env.example) for the full list. Generate a NextAuth
secret with `openssl rand -base64 32`.

Apply the database schema, then start the dev server:

```bash
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

### Scripts

```bash
npm run dev        # dev server (Turbopack)
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # Vitest (unit tests)
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/         # Google sign-in page
│   ├── api/                  # Route handlers (binders, cards, stats, wishlist, public)
│   ├── b/[binderId]/         # Public read-only binder share page
│   ├── binder/[binderId]/    # Main binder editor
│   └── dashboard/            # Binder list, stats, wishlist
├── components/
│   ├── binder/               # Flat two-page editor, card slots
│   ├── cards/                # Search panel, card grid, zoom modal
│   ├── layout/               # Top nav, sidebars, editor layout
│   └── ui/                   # GlassPanel and shared primitives
├── hooks/                    # useBinderData, useBinderPersist
├── lib/                      # Prisma client, NextAuth config, TCGdex client, utils, env, logging
├── store/                    # Zustand stores (binder, UI, card search)
└── types/                    # Shared TypeScript types
prisma/
├── schema.prisma             # DB schema
└── migrations/               # Migration history
```

---

## Database Schema

```
User ──< Binder ──< BinderPage ──< CardSlot
User ──< WishlistItem
```

Card data is stored **denormalized** in `CardSlot` (id, name, image URL, set name) so binders load instantly without hitting the TCGdex API on every page view. Full card metadata is only fetched when a user zooms in on a card.

---

## Deployment

The app is designed for [Vercel](https://vercel.com) + [Neon](https://neon.tech):

1. Push to GitHub. CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests,
   and a production build on every PR and on `master`.
2. Import the repo in Vercel.
3. Add the environment variables from [`.env.example`](./.env.example) in the
   Vercel project settings:
   - **`DATABASE_URL`** — Neon's **pooled** connection string (host contains
     `-pooler`). Serverless functions open many connections, so a non-pooled URL
     will exhaust Postgres under load.
   - **`DIRECT_URL`** — Neon's **direct** (non-pooled) string, for migrations.
   - **`NEXTAUTH_URL`** — your production `https://` domain.
   - `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
4. In the Google OAuth client, add the production redirect URI
   `https://<your-domain>/api/auth/callback/google` (and the domain to Authorized
   JavaScript origins).
5. Apply migrations against the production database: `npx prisma migrate deploy`
   (run with the production `DIRECT_URL` set).
6. Deploy.

Security headers (HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, and a baseline CSP) are set in
`next.config.ts` and apply in production over HTTPS.

---

## License

MIT
