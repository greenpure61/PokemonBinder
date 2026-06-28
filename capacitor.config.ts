import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor uses the "remote URL" strategy: the native shell loads the deployed
 * Next.js site directly (SSR, API routes, and NextAuth keep working). See MOBILE.md.
 *
 * `webDir` is still required by the CLI — its contents are bundled into the APK as
 * an offline fallback that is only shown when `server.url` is unreachable.
 */
const config: CapacitorConfig = {
  appId: "app.binder.mobile",
  appName: "Binder",
  webDir: "capacitor-webdir",
  server: {
    url: "https://pokemon-binder-nine.vercel.app",
    // The remote site is HTTPS-only; never fall back to cleartext.
    cleartext: false,
  },
};

export default config;
