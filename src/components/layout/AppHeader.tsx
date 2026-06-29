"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LibraryBig, Compass, Star, BarChart3, LogOut, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { nativeGoogleSignOut } from "@/lib/nativeAuth";

const NAV = [
  { href: "/dashboard", label: "Binders", icon: LibraryBig, match: (p: string) => p === "/dashboard" },
  { href: "/dashboard/explore", label: "Explore", icon: Compass, match: (p: string) => p.startsWith("/dashboard/explore") },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Star, match: (p: string) => p.startsWith("/dashboard/wishlist") },
  { href: "/dashboard/stats", label: "Stats", icon: BarChart3, match: (p: string) => p.startsWith("/dashboard/stats") },
];

export function AppHeader() {
  const pathname = usePathname() ?? "";
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="text-base font-extrabold tracking-tight text-foreground">
            Pokémon<span className="text-primary">Binder</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-1 pr-2 transition-colors hover:bg-surface-muted"
            >
              {user.image ? (
                <Image src={user.image} alt="" width={28} height={28} className="rounded-full" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {(user.name ?? user.email ?? "?")[0]?.toUpperCase()}
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-subtle" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
                  >
                    <div className="border-b border-border px-4 py-3">
                      <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await nativeGoogleSignOut();
                        signOut({ callbackUrl: "/login" });
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}
