import { create } from "zustand";
import type { PokeTCGCard } from "@/types/pokemontcg";

type ActiveModal = "createBinder" | "settings" | null;

interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  zoomedCard: PokeTCGCard | null;
  activeModal: ActiveModal;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  zoomCard: (card: PokeTCGCard | null) => void;
  openModal: (m: ActiveModal) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  zoomedCard: null,
  activeModal: null,
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  zoomCard: (zoomedCard) => set({ zoomedCard }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),
}));
