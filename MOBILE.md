# Mobile App (Capacitor) — Progress Tracker

Turning PokemonBinder into a phone app. This file tracks the plan, decisions, and
status across work sessions. Last updated: **2026-06-28**.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Goal & strategy

Ship PokemonBinder as a native phone app, **without rewriting** the existing app.

- **Approach: Capacitor, remote-URL strategy.** The native shell points its
  `server.url` at the deployed Next.js site — it keeps SSR, API routes, and
  NextAuth working. We are **not** doing a static export or a React Native / Flutter
  rewrite (the binder editor is dnd-kit + framer-motion, which don't port).
- **Backend stays Next.js.** The `src/app/api/*` route handlers already are a REST
  API; logic lives in `src/lib/*`, so it's portable later if ever needed. 10k users
  is not a scaling concern for this app.

## Key constraints

- **Dev machine is Windows 10** → iOS builds need macOS/Xcode → **Android-first**;
  iOS later via a cloud Mac (Codemagic / GitHub Actions macOS / Appflow).
- **Google OAuth is blocked inside embedded WebViews** → native login must move to
  the system browser / native Google sign-in, exchanging for an app token (Step 4).
- **App-store naming:** "Pokémon" is a Nintendo/TPC trademark and can't be the store
  name. Rebrand deferred to ~Step 10. Explored (all `.app` available): HoloBinder,
  Cardrobe, Cardcove, VaultBinder — none registered yet.

## Infra

- **Host: Vercel + Neon.** Production: **https://pokemon-binder-nine.vercel.app**
  (this is the Capacitor `server.url`). Keeping this URL for now; custom domain
  deferred to ~Step 10. Don't hardcode the URL deeply — swapping it later costs a
  `NEXTAUTH_URL` + Google OAuth callback update.
- `DATABASE_URL` = Neon **pooled** (`-pooler`); `DIRECT_URL` = Neon direct (for
  migrations). Vercel needs `postinstall: prisma generate` or the build fails.

---

## 10-step plan

- [x] **Step 1 — Deploy to stable HTTPS + pooling** (PR #7)
- [x] **Step 2 — Phone-ready UI** (PR #8, + iOS long-press fix #9)
- [x] **Step 3 — Scaffold Capacitor (Android-first)** — scaffolded, builds, and runs on the emulator (login page renders in the WebView; hits the Google auth wall)
- [ ] Step 4 — Native auth (Google sign-in out of the WebView) ← next, the hard part
- [ ] Step 5 — Native plugins (share, haptics, push, camera)
- [ ] Step 6 — Deep links for `/b/[binderId]` sharing
- [ ] Step 7 — Icons / splash / native config
- [ ] Step 8 — Android build (local, Windows)
- [ ] Step 9 — iOS via cloud Mac (+ Sign in with Apple if Google login on iOS)
- [ ] Step 10 — Device QA + store submission (rebrand + custom domain here)

---

## Done — details

### Step 1 — Deploy + pooling ✅ (PR #7)
- Split pooled runtime URL from direct migration URL (`prisma.config.ts`,
  `.env.example`), added `postinstall: prisma generate`, expanded README deploy docs.
- Deployed to Vercel + Neon; Google login + create-a-binder-persist confirmed in prod.

### Step 2 — Phone-ready binder editor ✅ (PR #8)
Mobile editing model (locked decisions):
1. **One page per screen** on phones with page-by-page Prev/Next; desktop keeps the
   two-page spread. (`useMediaQuery` hook; `currentPageIndex`/`goToPage` in
   `binderStore`, synced with spread.)
2. **Tap-to-place**: on touch, tap a search card to arm it (drawer closes); tap an
   empty slot to drop it. Long-press drag still rearranges. ("Placing…" banner.)
3. **⋯ button** on filled slots (visible on coarse pointers) opens the existing
   wishlist/view/remove menu — previously hover + right-click only (dead on touch).

Also: edit affordances gated behind `editable` (public view opts out);
`h-screen → h-dvh` (editor + public view); theme-color `viewport` export; web
`manifest.ts`.

### iOS long-press drag fix ✅ (PR #9)
iOS Safari's long-press image callout ("Save Image") hijacked the drag gesture.
Fixed with `-webkit-touch-callout: none` / `-webkit-user-drag: none` on `img` +
`touch-action: none` on draggable slots. Confirmed working on iPhone.

### Step 3 — Scaffold Capacitor ✅
- **Capacitor 8.4.1.** Installed `@capacitor/core` + `@capacitor/android` (deps) and
  `@capacitor/cli` (dev). `appId: app.binder.mobile`, `appName: Binder` — a neutral
  placeholder; rebrand still deferred to Step 10 (regenerate `android/` then).
- **`capacitor.config.ts`** uses the remote-URL strategy: `server.url =
  https://pokemon-binder-nine.vercel.app`, `cleartext: false`. `webDir =
  capacitor-webdir/` holds a tiny dark-themed offline fallback `index.html` (bundled
  into the APK, shown only when the remote URL is unreachable).
- `npx cap add android` scaffolded the native project (committed; Capacitor's
  `android/.gitignore` keeps `local.properties` + build artifacts out).
- **Debug APK builds clean** (`gradlew :app:assembleDebug`, BUILD SUCCESSFUL,
  ~3.9 MB). Built with the Android-Studio-bundled JBR (JDK 21) and the SDK at
  `%LOCALAPPDATA%\Android\Sdk`; Gradle auto-accepted licenses and pulled the missing
  build-tools 35 + platform android-36. `compileSdk/targetSdk = 36`, `minSdk = 24`.
- **Ran on the emulator ✅.** Installed `cmdline-tools` + `system-images;android-36;
  google_apis;x86_64` via `sdkmanager`, created the **`binder_pixel`** AVD (Pixel 7,
  WHPX-accelerated), booted it, `adb install -r app-debug.apk`, launched. The
  deployed login page renders inside the Capacitor WebView — remote-URL strategy
  confirmed working end-to-end.
- **Auth-wall finding (feeds Step 4):** the login page's "Continue with Google" →
  `accounts.google.com` is a **different host than `server.url`**, so Capacitor's
  default off-origin handling opens it in the **system Chrome browser**, not the
  embedded WebView. Good (Google blocks embedded WebViews) — but the OAuth callback
  cookie then lands in *Chrome*, not the app. Closing that loop (return to the app +
  share the session) is exactly the Step 4 work.

#### Build / run env (so the next session doesn't re-derive it)
```
JAVA_HOME    = %ProgramFiles%\Android\Android Studio\jbr   (JDK 21.0.10)
ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk
SDK tools added: cmdline-tools/latest, platform-tools, emulator,
                 system-images;android-36;google_apis;x86_64
AVD          = binder_pixel  (Pixel 7, android-36 google_apis x86_64)

build   : cd android && ./gradlew :app:assembleDebug --no-daemon
emulator: %ANDROID_HOME%\emulator\emulator.exe -avd binder_pixel -no-snapshot
install : %ANDROID_HOME%\platform-tools\adb.exe install -r \
          android/app/build/outputs/apk/debug/app-debug.apk
launch  : adb shell monkey -p app.binder.mobile -c android.intent.category.LAUNCHER 1
```
`java`/`adb` are not on PATH and `ANDROID_HOME` isn't a persistent env var — set
them per-shell as above (or add them to the user env to make `npx cap run android`
seamless).

---

## Deferred (intentionally)

- `viewport-fit=cover` + safe-area insets → Capacitor step (Step 3/7), where the
  status-bar overlay is handled and testable on a device.
- Full maskable icon set (192/512 PNG) → Step 7 (`@capacitor/assets`).
- Bigger tap targets in the search drawer (P2 polish).
- Public binder view still shows the two-page spread on mobile (could get the same
  single-page treatment later).

## Recurring gotchas (learned the hard way)

- **Google OAuth does NOT work on Vercel preview URLs** — only the production
  callback is registered, and Google allows no wildcard redirect URIs. Test
  auth-gated changes on **production** (or whitelist the stable branch-preview
  callback).
- **Vercel needs `postinstall: prisma generate`** or `next build` fails typecheck
  (`tx` implicitly any in the slots `$transaction`).
- Use **`h-dvh`** not `h-screen` for full-height mobile layouts.

---

## Next session → Step 4 (Native auth — the hard part)

Step 3 is done; the emulator shows our login page but **can't get past Google
sign-in** because the OAuth callback completes in the system browser, not the app
(see the auth-wall finding above). Step 4 closes that loop:

1. Native Google sign-in **out of the WebView** (system browser / native flow),
   returning to the app via a deep link with an auth code/token — not relying on the
   NextAuth cookie landing in the WebView.
2. Teach `requireUserId` in `src/lib/api.ts` to accept a **bearer token** alongside
   the existing cookie session, so the web app stays unchanged (the native shell
   sends `Authorization: Bearer …`; web keeps using the NextAuth cookie).
3. Candidate libs: `@capacitor-community/generic-oauth2` or
   `@codetrix-studio/capacitor-google-auth` for the native sign-in half.
