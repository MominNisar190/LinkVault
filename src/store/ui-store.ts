"use client";

import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  selectedLinkIds: string[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (val: boolean) => void;
  selectLink: (id: string) => void;
  deselectLink: (id: string) => void;
  selectAllLinks: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  selectedLinkIds: [],

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

  selectLink: (id) =>
    set((state) => ({
      selectedLinkIds: state.selectedLinkIds.includes(id)
        ? state.selectedLinkIds
        : [...state.selectedLinkIds, id],
    })),

  deselectLink: (id) =>
    set((state) => ({
      selectedLinkIds: state.selectedLinkIds.filter((x) => x !== id),
    })),

  selectAllLinks: (ids) => set({ selectedLinkIds: ids }),

  clearSelection: () => set({ selectedLinkIds: [] }),

  isSelected: (id) => get().selectedLinkIds.includes(id),
}));
