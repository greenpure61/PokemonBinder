"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useBinders, useCreateBinder, useDeleteBinder, useUpdateBinderById, type BinderListItem } from "@/hooks/useBinderData";
import { BinderCard } from "@/components/dashboard/BinderCard";
import { CreateBinderModal } from "@/components/dashboard/CreateBinderModal";
import { EditBinderModal } from "@/components/dashboard/EditBinderModal";
import type { BinderLayout } from "@/types/binder";

interface Props {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

export function DashboardContent({ user }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BinderListItem | null>(null);
  const { data: binders, isLoading } = useBinders();
  const createBinder = useCreateBinder();
  const deleteBinder = useDeleteBinder();
  const updateBinder = useUpdateBinderById();

  async function handleCreate(data: { name: string; pocketLayout: BinderLayout; pageCount: number; coverColor: string }) {
    await createBinder.mutateAsync(data);
    setModalOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this binder? This cannot be undone.")) return;
    await deleteBinder.mutateAsync(id);
  }

  async function handleEditSave(binderId: string, data: { name: string; coverColor: string }) {
    await updateBinder.mutateAsync({ binderId, data });
    setEditing(null);
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎴</span>
            <span className="font-semibold text-white">PokemonBinder</span>
          </div>
          <div className="flex items-center gap-3">
            {user.image && (
              <Image src={user.image} alt="" width={32} height={32} className="rounded-full" />
            )}
            <span className="text-sm text-white/60">{user.name ?? user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg px-3 py-1.5 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Binders</h1>
            <p className="text-sm text-white/40 mt-1">
              {binders ? `${binders.length} binder${binders.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/stats"
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 hover:text-white hover:border-white/25 transition-colors"
            >
              Stats
            </Link>
            <Link
              href="/dashboard/wishlist"
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 hover:text-white hover:border-white/25 transition-colors"
            >
              ⭐ Wishlist
            </Link>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-white/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Binder
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : binders?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-lg font-medium text-white/70">No binders yet</h2>
            <p className="text-sm text-white/30 mt-1 mb-6">Create your first binder to get started</p>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-white/10 border border-white/10 px-5 py-2.5 text-sm text-white hover:bg-white/15 transition-colors"
            >
              Create a binder
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {binders?.map((binder) => (
              <motion.div key={binder.id} variants={item}>
                <BinderCard binder={binder} onDelete={handleDelete} onEdit={setEditing} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <CreateBinderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        isLoading={createBinder.isPending}
      />

      <EditBinderModal
        binder={editing}
        onClose={() => setEditing(null)}
        onSave={handleEditSave}
        isLoading={updateBinder.isPending}
      />
    </div>
  );
}
