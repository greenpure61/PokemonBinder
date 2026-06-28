"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/layout/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { isNativeApp, nativeGoogleSignIn } from "@/lib/nativeAuth";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  async function handleSignIn() {
    setError(null);
    // Web: the standard NextAuth redirect. Native: Google blocks in-WebView OAuth,
    // so use the OS account picker and exchange the idToken for a session cookie.
    if (!isNativeApp()) {
      signIn("google", { callbackUrl: "/dashboard" });
      return;
    }
    setBusy(true);
    try {
      const ok = await nativeGoogleSignIn(); // navigates to /dashboard on success
      if (!ok) setBusy(false); // user cancelled the picker
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Sign-in failed. Please try again.");
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(37,99,235,0.12), transparent 60%), radial-gradient(ellipse 50% 50% at 90% 100%, rgba(245,185,30,0.10), transparent 55%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm"
      >
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-xl">
          <div className="mb-7 flex flex-col items-center text-center">
            <Logo className="mb-4 h-14 w-14" />
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Pokémon<span className="text-primary">Binder</span>
            </h1>
            <p className="mt-2 text-sm text-muted">Build, organize, and share your Pokémon TCG collection.</p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={busy}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-surface-muted active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Spinner className="h-5 w-5" /> : <GoogleIcon />}
            {busy ? "Signing in…" : "Continue with Google"}
          </button>

          {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}

          <p className="mt-6 text-center text-xs text-subtle">By signing in, you agree to our terms of service.</p>
        </div>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
