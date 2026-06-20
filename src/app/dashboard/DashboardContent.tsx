"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, LibraryBig } from "lucide-react";
import {
  useBinders,
  useCreateBinder,
  useDeleteBinder,
  useUpdateBinderById,
  type BinderListItem,
} from "@/hooks/useBinderData";
import { AppHeader } from "@/components/layout/AppHeader";
import { BinderCard } from "@/components/dashboard/BinderCard";
import { CreateBinderModal } from "@/components/dashboard/CreateBinderModal";
import { EditBinderModal } from "@/components/dashboard/EditBinderModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import type { BinderLayout } from "@/types/binder";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

export function DashboardContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BinderListItem | null>(null);
  const [deleting, setDeleting] = useState<BinderListItem | null>(null);
  const { data: binders, isLoading } = useBinders();
  const createBinder = useCreateBinder();
  const deleteBinder = useDeleteBinder();
  const updateBinder = useUpdateBinderById();
  const { toast } = useToast();

  async function handleCreate(data: { name: string; pocketLayout: BinderLayout; pageCount: number; coverColor: string }) {
    try {
      await createBinder.mutateAsync(data);
      setModalOpen(false);
      toast("Binder created", "success");
    } catch {
      toast("Couldn't create binder", "error");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteBinder.mutateAsync(deleting.id);
      toast("Binder deleted", "success");
    } catch {
      toast("Couldn't delete binder", "error");
    }
    setDeleting(null);
  }

  async function handleEditSave(binderId: string, data: { name: string; coverColor: string }) {
    try {
      await updateBinder.mutateAsync({ binderId, data });
      setEditing(null);
      toast("Changes saved", "success");
    } catch {
      toast("Couldn't save changes", "error");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">My binders</h1>
            <p className="mt-1 text-sm text-muted">
              {binders
                ? `${binders.length} binder${binders.length !== 1 ? "s" : ""} in your collection`
                : "Loading your collection…"}
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="flex-shrink-0">
            <Plus className="h-4 w-4" />
            New binder
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : binders?.length === 0 ? (
          <EmptyState
            icon={<LibraryBig className="h-7 w-7" />}
            title="No binders yet"
            description="Create your first binder to start building and organizing your Pokémon card collection."
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create a binder
              </Button>
            }
          />
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {binders?.map((binder) => (
              <motion.div key={binder.id} variants={item}>
                <BinderCard binder={binder} onDelete={setDeleting} onEdit={setEditing} />
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

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete binder?"
        description={
          deleting
            ? `"${deleting.name}" and all of its pages will be permanently removed. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={deleteBinder.isPending}
      />
    </div>
  );
}
