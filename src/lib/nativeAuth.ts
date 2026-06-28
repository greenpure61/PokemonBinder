import { Capacitor } from "@capacitor/core";

/**
 * Native (Capacitor) authentication helpers.
 *
 * Google blocks OAuth inside embedded WebViews, so on the native app we can't use
 * the web `signIn("google")` redirect. Instead we use the OS Google account picker
 * (via @capgo/capacitor-social-login → Android Credential Manager) to obtain a
 * Google `idToken`, then hand it to `POST /api/auth/native`, which verifies it and
 * sets a normal NextAuth session cookie in the WebView. From there the app behaves
 * exactly like the web app (SSR + API routes read the cookie). See MOBILE.md Step 4.
 */

/** True when running inside the Capacitor native shell (false on the web). */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Runs the native Google sign-in and establishes a session, then hard-navigates to
 * `/dashboard` so the server re-renders with the new session cookie.
 *
 * Resolves to `false` if the user cancelled the picker (caller can stay on /login);
 * throws on real failures.
 */
export async function nativeGoogleSignIn(): Promise<boolean> {
  const webClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!webClientId) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
  }

  // Imported lazily so the plugin's bridge code never runs during SSR / on the web.
  const { SocialLogin } = await import("@capgo/capacitor-social-login");

  await SocialLogin.initialize({ google: { webClientId } });

  let idToken: string | null;
  try {
    // No `scopes`: we only need authentication, and the Google idToken already
    // carries email + basic profile (name, picture, sub). Requesting extra scopes
    // would require wiring an authorization result handler into MainActivity.
    const { result } = await SocialLogin.login({ provider: "google", options: {} });
    idToken = result.responseType === "online" ? result.idToken : null;
  } catch (err) {
    // The plugin rejects with code "USER_CANCELLED" when the picker is dismissed.
    if ((err as { code?: string })?.code === "USER_CANCELLED") return false;
    throw err;
  }

  if (!idToken) {
    throw new Error("Google sign-in did not return an idToken");
  }

  const res = await fetch("/api/auth/native", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    throw new Error(`Sign-in failed (${res.status}): ${await res.text()}`);
  }

  // Cookie is set; full reload lets SSR pick up the session.
  window.location.assign("/dashboard");
  return true;
}

/** Clears the native Google credential state (best-effort) before NextAuth sign-out. */
export async function nativeGoogleSignOut(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    await SocialLogin.logout({ provider: "google" });
  } catch {
    // Non-fatal: the NextAuth cookie clear is what actually ends the app session.
  }
}
