"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ArrowLeft, Share2, Check, PanelRight, LogOut, Loader2 } from "lucide-react";
import type { BinderWithPages } from "@/types/binder";
import { useUIStore } from "@/store/uiStore";
import { useBinderStore } from "@/store/binderStore";
import { IconButton } from "@/components/ui/IconButton";

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
    if (e.key === "Escape") {
      setNameValue(binder.name);
      setIsEditingName(false);
    }
  }

  return (
    <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-3 py-2.5">
      {/* Left: menu toggle + back + name */}
      <div className="flex min-w-0 items-center gap-1.5">
        <IconButton aria-label="Toggle card library" size="sm" onClick={toggleLeft}>
          <Menu className="h-4 w-4" />
        </IconButton>

        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="mx-1 h-5 w-px flex-shrink-0 bg-border" />

        {/* Inline name editor */}
        {isEditingName ? (
          <input
            ref={nameRef}
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={onNameKeyDown}
            className="w-48 min-w-0 rounded-lg border border-primary bg-surface px-2 py-1 text-sm font-semibold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
        ) : (
          <button
            onClick={() => {
              setIsEditingName(true);
              setNameValue(binder.name);
            }}
            className="max-w-[180px] cursor-pointer truncate rounded-lg px-2 py-1 text-left text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
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
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          {shareLabel === "Copied!" ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          {shareLabel}
        </button>

        <SaveStatus isSaving={isSaving} isDirty={isDirty} />

        {/* User avatar dropdown */}
        {session?.user && (
          <div className="relative">
            <button
              onClick={() => setAvatarOpen((v) => !v)}
              className="h-7 w-7 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border border-border transition-colors hover:border-border-strong"
              aria-label="Account menu"
            >
              {session.user.image ? (
                <Image src={session.user.image} alt={session.user.name ?? ""} width={28} height={28} className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-primary-soft text-xs font-bold text-primary">
                  {(session.user.name ?? "?")[0].toUpperCase()}
                </span>
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
                    className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
                  >
                    <div className="border-b border-border px-4 py-3">
                      <p className="truncate text-sm font-semibold text-foreground">{session.user.name}</p>
                      <p className="truncate text-xs text-muted">{session.user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
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

        <IconButton aria-label="Toggle page navigator" size="sm" onClick={toggleRight}>
          <PanelRight className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  );
}

function SaveStatus({ isSaving, isDirty }: { isSaving: boolean; isDirty: boolean }) {
  if (isSaving) {
    return (
      <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (isDirty) {
    return (
      <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Unsaved
      </span>
    );
  }
  return (
    <span className="hidden items-center gap-1.5 text-xs text-subtle sm:flex">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      Saved
    </span>
  );
}
