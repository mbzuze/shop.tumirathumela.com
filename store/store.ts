import { Product } from "@/lib/cms-types";
import { clear } from "console";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BasketItem {
  product: Product;
  quantity: number;
}

interface BasketState {
  items: BasketItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearBasket: () => void;
  getTotalPrice: () => number;
  getItemCount: (productId: string) => number;
  getGroupedItems: () => BasketItem[];

  appliedCoupon: {
    code: string;
    discountPercent: number;
    discountAmount: number;
    applicableProductIds: string[];
  } | null;
  applyCoupon: (couponData: {
    code: string;
    discountPercent: number;
    discountAmount: number;
    applicableProductIds: string[];
  }) => void;
  removeCoupon: () => void;
}

const useBasketStore = create<BasketState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product._id === product._id,
          );
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product._id === product._id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          } else {
            return {
              items: [...state.items, { product, quantity: 1 }],
            };
          }
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.reduce((acc, item) => {
            if (item.product._id === productId) {
              if (item.quantity > 1) {
                return [...acc, { ...item, quantity: item.quantity - 1 }];
              }
            } else {
              return [...acc, item];
            }
            return acc;
          }, [] as BasketItem[]),
        }));
      },
      updateQty: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) => 
            item.product._id === productId 
              ? { ...item, quantity: Math.max(0, quantity) }
              : item
          ).filter(item => item.quantity > 0)
        }));
      },
      clearBasket: () => {
        set({ items: [], appliedCoupon: null });
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("basket-sync");
          channel.postMessage({ type: "CLEAR_BASKET" });
          channel.close();
        }
      },
      applyCoupon: (couponData) => {
        set({ appliedCoupon: couponData });
      },
      removeCoupon: () => {
        set({ appliedCoupon: null });
      },
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + (item.product.price ?? 0) * item.quantity,
          0,
        );
      },
      getItemCount: (productId) => {
        const item = get().items.find((item) => item.product._id === productId);
        return item ? item.quantity : 0;
      },
      getGroupedItems: () => get().items,
    }),
    {
      name: "basket-store",
    },
  ),
);

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  const channel = new BroadcastChannel("basket-sync");
  channel.onmessage = (event) => {
    if (event.data.type === "CLEAR_BASKET") {
      // Prevent infinite loop by not broadcasting again if already cleared
      const state = useBasketStore.getState();
      if (state.items.length > 0 || state.appliedCoupon !== null) {
        state.clearBasket();
      }
    }
  };
}

export default useBasketStore;
