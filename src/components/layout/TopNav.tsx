"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import type { BinderWithPages } from "@/types/binder";
import { useUIStore } from "@/store/uiStore";
import { useBinderStore } from "@/store/binderStore";

interface Props {
  binder: BinderWithPages;
  isDirty: boolean;
  isSaving: boolean;
}

export function TopNav({ binder, isDirty, isSaving }: Props) {
  const toggleLeft = useUIStore((s) => s.toggleLeftSidebar);
  const toggleRight = useUIStore((s) => s.toggleRightSidebar);
  const updateName = useBinderStore((s) => s.updateName);
  const updateIsPublic = useBinderStore((s) => s.updateIsPublic);

  const { data: session } = useSession();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(binder.name);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [shareLabel, setShareLabel] = useState<"Share" | "Copied!">("Share");
  const nameRef = useRef<HTMLInputElement>(null);

  async function handleShare() {
    if (!binder.isPublic) {
      await fetch(`/api/binders/${binder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      });
      updateIsPublic(true);
    }
    const url = `${window.location.origin}/b/${binder.id}`;
    await navigator.clipboard.writeText(url);
    setShareLabel("Copied!");
    setTimeout(() => setShareLabel("Share"), 2000);
  }

  async function saveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === binder.name) {
      setNameValue(binder.name);
      setIsEditingName(false);
      return;
    }
    updateName(trimmed);
    setIsEditingName(false);
    await fetch(`/api/binders/${binder.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
  }

  function onNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") nameRef.current?.blur();
    if (e.key === "Escape") { setNameValue(binder.name); setIsEditingName(false); }
  }

  return (
    <header className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 flex-shrink-0">
      {/* Left: menu toggle + back + name */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleLeft}
          aria-label="Toggle card search"
          className="rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link
          href="/dashboard"
          className="rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
          aria-label="Back to dashboard"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="w-px h-4 bg-white/10 flex-shrink-0" />

        {/* Inline name editor */}
        {isEditingName ? (
          <input
            ref={nameRef}
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={onNameKeyDown}
            className="bg-white/8 border border-white/20 rounded-lg px-2 py-0.5 text-sm font-medium text-white focus:outline-none w-48 min-w-0"
          />
        ) : (
          <button
            onClick={() => { setIsEditingName(true); setNameValue(binder.name); }}
            className="text-sm font-medium text-white hover:text-white/80 transition-colors truncate max-w-[180px] text-left"
            title="Click to rename"
          >
            {binder.name}
          </button>
        )}
      </div>

      {/* Right: share + save status + avatar + right panel toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/50 hover:text-white hover:border-white/25 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {shareLabel}
        </button>

        {isSaving ? (
          <span className="text-xs text-white/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
            Saving…
          </span>
        ) : isDirty ? (
          <span className="text-xs text-white/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
            Unsaved
          </span>
        ) : (
          <span className="text-xs text-white/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
            Saved
          </span>
        )}

        {/* User avatar dropdown */}
        {session?.user && (
          <div className="relative">
            <button
              onClick={() => setAvatarOpen((v) => !v)}
              className="rounded-full overflow-hidden w-7 h-7 border border-white/10 hover:border-white/30 transition-colors flex-shrink-0"
              aria-label="User menu"
            >
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  width={28}
                  height={28}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs text-white/60">
                  {(session.user.name ?? "?")[0].toUpperCase()}
                </div>
              )}
            </button>

            <AnimatePresence>
              {avatarOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-2 z-50 glass rounded-xl p-1 w-44 shadow-xl"
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-xs text-white/80 font-medium truncate">{session.user.name}</p>
                      <p className="text-xs text-white/35 truncate">{session.user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Sign out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          onClick={toggleRight}
          aria-label="Toggle page navigator"
          className="rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>
      </div>
    </header>
  );
}
