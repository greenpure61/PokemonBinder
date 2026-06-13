# PokemonBinder

A premium Pokémon card collection manager with an interactive 3D binder, drag-and-drop card editing, and full collection tracking.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript) ![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma) ![Three.js](https://img.shields.io/badge/Three.js-0.184-black?style=flat-square&logo=three.js)

---

## Features

### 3D Binder Viewer
- Interactive 3D binder rendered with React Three Fiber
- Procedural leatherette cover texture with stitching detail
- Chrome ring mechanism with 4 rings
- Smooth page-flip animation with a natural Z-lift arc
- Orbit controls — rotate, zoom, inspect from any angle
- Studio lighting with contact shadows

### Flat Editor
- Two-page spread with drag-and-drop card placement (dnd-kit)
- Drag cards from the search panel directly into any slot
- Swap cards between slots by dragging one onto another
- Right-click any card for a context menu: **Add to Wishlist**, **View Card**, **Remove**
- Click to zoom into full card details
- Auto-saves after 1.5 seconds of inactivity

### Card Search
- Powered by the [PokéTCG API](https://pokemontcg.io/) (proxied server-side)
- Search by name with 400ms debounce
- Filter by type (Fire, Water, Grass, Lightning, …)
- Infinite scroll with intersection observer

### Collection Tools
- **Public share** — make any binder public and share a read-only 3D link
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
| 3D | React Three Fiber v9, Drei v10, Three.js |
| Animation | Framer Motion v12, @react-spring/three |
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
- Node.js 22+
- A [Neon](https://neon.tech) PostgreSQL database
- A Google OAuth app ([console.cloud.google.com](https://console.cloud.google.com))
- A [PokéTCG API key](https://pokemontcg.io/) (free tier: 20k req/day)

### Setup

```bash
git clone https://github.com/greenpure61/PokemonBinder.git
cd PokemonBinder
npm install
```

Create `.env.local`:

```env
DATABASE_URL="postgresql://..."          # Neon connection string
NEXTAUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
POKEMONTCG_API_KEY="..."                 # Optional — works without it at lower rate limits
```

Run the database migration:

```bash
npx prisma migrate deploy
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

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
│   ├── binder/               # 3D canvas, mesh, page flip, flat editor, card slots
│   ├── cards/                # Search panel, card grid, zoom modal
│   ├── layout/               # Top nav, sidebars, editor layout
│   └── ui/                   # GlassPanel and shared primitives
├── hooks/                    # useBinderData, useBinderPersist
├── lib/                      # Prisma client, NextAuth config, PokéTCG client, utils
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

Card data is stored **denormalized** in `CardSlot` (id, name, image URL, set name) so binders load instantly without hitting the PokéTCG API on every page view. Full card metadata is only fetched when a user zooms in on a card.

---

## Deployment

The app is designed for [Vercel](https://vercel.com) + [Neon](https://neon.tech):

1. Push to GitHub
2. Import the repo in Vercel
3. Add all environment variables from `.env.local`
4. Deploy

---

## License

MIT
