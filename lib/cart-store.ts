import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/components/product/ProductCard';

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: Product, quantity: number, size?: string) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed
  getSubtotal: () => number;
  getItemCount: () => number;
  hasLinenWoolConflict: () => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity, size) => {
        set((state) => {
          // Check if item with same product and size already exists
          const existingIndex = state.items.findIndex(
            (item) => item.product.id === product.id && item.size === size
          );

          if (existingIndex > -1) {
            // Update quantity of existing item
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          } else {
            // Add new item
            return { items: [...state.items, { product, quantity, size }] };
          }
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId)
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            return { items: state.items.filter((item) => item.product.id !== productId) };
          }

          const newItems = state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          );
          return { items: newItems };
        });
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),

      closeCart: () => set({ isOpen: false }),

      getSubtotal: () => {
        const state = get();
        return state.items.reduce((total, item) => {
          return total + (item.product.price * item.quantity);
        }, 0);
      },

      getItemCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      },

      hasLinenWoolConflict: () => {
        const state = get();
        const fabricTypes = new Set<string>();

        // Collect all fabric types from cart items
        state.items.forEach((item) => {
          // Check product name for fabric types
          const name = item.product.name.toLowerCase();
          if (name.includes('linen')) {
            fabricTypes.add('linen');
          }
          if (name.includes('wool') || name.includes('cashmere') || name.includes('merino')) {
            fabricTypes.add('wool');
          }
        });

        // Return true if cart contains both linen and wool
        return fabricTypes.has('linen') && fabricTypes.has('wool');
      },
    }),
    {
      name: 'frequency-form-cart', // localStorage key
      partialize: (state) => ({ items: state.items }), // Only persist items, not isOpen
    }
  )
);
