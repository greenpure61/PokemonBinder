import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor uses the "remote URL" strategy: the native shell loads the deployed
 * Next.js site directly (SSR, API routes, and NextAuth keep working). See MOBILE.md.
 *
 * `webDir` is still required by the CLI — its contents are bundled into the APK as
 * an offline fallback that is only shown when `server.url` is unreachable.
 */
// Dev override: point the native shell at a local dev server (e.g. the Next.js
// dev server reachable from the Android emulator at http://10.0.2.2:3000) so we
// can iterate on native features without redeploying. Set CAP_SERVER_URL before
// running `npx cap sync`. Unset → production.
const devServerUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "app.binder.mobile",
  appName: "Binder",
  webDir: "capacitor-webdir",
  server: devServerUrl
    ? { url: devServerUrl, cleartext: true }
    : {
        url: "https://pokemon-binder-nine.vercel.app",
        // The remote site is HTTPS-only; never fall back to cleartext.
        cleartext: false,
      },
  plugins: {
    // @capgo/capacitor-social-login bundles every provider's SDK by default. We
    // only use Google, so disable the rest (false → compile-only stub, no SDK) —
    // this trims the APK and avoids the Facebook SDK's crash-on-launch auto-init.
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
    },
  },
};

export default config;
