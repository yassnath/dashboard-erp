import { create } from "zustand";

type UiState = {
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  highContrast: boolean;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  toggleHighContrast: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  commandOpen: false,
  highContrast: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
}));
