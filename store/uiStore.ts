import { create } from "zustand";

interface UIState {
  drawerMenuOpen: boolean;
  cartDrawerOpen: boolean;
  locationModalOpen: boolean;
  setDrawerMenu: (open: boolean) => void;
  setCartDrawer: (open: boolean) => void;
  setLocationModal: (open: boolean) => void;
  toggleDrawerMenu: () => void;
  toggleCartDrawer: () => void;
  toggleLocationModal: () => void;
}

const useUIStore = create<UIState>((set) => ({
  drawerMenuOpen: false,
  cartDrawerOpen: false,
  locationModalOpen: false,
  setDrawerMenu: (open) => set({ drawerMenuOpen: open }),
  setCartDrawer: (open) => set({ cartDrawerOpen: open }),
  setLocationModal: (open) => set({ locationModalOpen: open }),
  toggleDrawerMenu: () => set((state) => ({ drawerMenuOpen: !state.drawerMenuOpen })),
  toggleCartDrawer: () => set((state) => ({ cartDrawerOpen: !state.cartDrawerOpen })),
  toggleLocationModal: () => set((state) => ({ locationModalOpen: !state.locationModalOpen })),
}));

export default useUIStore;
