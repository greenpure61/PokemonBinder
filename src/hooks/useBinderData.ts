import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BinderWithPages, CreateBinderInput, UpdateBinderInput } from "@/types/binder";

export type BinderListItem = BinderWithPages & { cardCount?: number; _count?: { pages: number } };

export function useBinders() {
  return useQuery<BinderListItem[]>({
    queryKey: ["binders"],
    queryFn: async () => {
      const res = await fetch("/api/binders");
      if (!res.ok) throw new Error("Failed to fetch binders");
      return res.json();
    },
  });
}

export function useBinder(binderId: string) {
  return useQuery<BinderWithPages>({
    queryKey: ["binder", binderId],
    queryFn: async () => {
      const res = await fetch(`/api/binders/${binderId}`);
      if (!res.ok) throw new Error("Failed to fetch binder");
      return res.json();
    },
    enabled: !!binderId,
  });
}

export function useCreateBinder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBinderInput) => {
      const res = await fetch("/api/binders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create binder");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["binders"] }),
  });
}

export function useUpdateBinder(binderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateBinderInput) => {
      const res = await fetch(`/api/binders/${binderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update binder");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["binders"] });
      qc.invalidateQueries({ queryKey: ["binder", binderId] });
    },
  });
}

export function useUpdateBinderById() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ binderId, data }: { binderId: string; data: UpdateBinderInput }) => {
      const res = await fetch(`/api/binders/${binderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update binder");
      return res.json();
    },
    onSuccess: (_data, { binderId }) => {
      qc.invalidateQueries({ queryKey: ["binders"] });
      qc.invalidateQueries({ queryKey: ["binder", binderId] });
    },
  });
}

export function useDeleteBinder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (binderId: string) => {
      const res = await fetch(`/api/binders/${binderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete binder");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["binders"] }),
  });
}
