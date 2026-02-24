import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../../../services/api";
import { useAuthStore } from "../../auth/stores/authStore";

//Mapea un item del servidor al formato de la UI
const mapServerItem = (row) => ({
  id: row.product_id,
  cartItemId: row.id,
  name: row.product_name,
  price: Number(row.product_price) || 0,
  image: row.product_image || "/placeholder-coffee.jpg",
  stock: typeof row.product_stock === "number" ? row.product_stock : undefined,
  quantity: row.quantity,
});

/**
 * Cart Store - Manejo centralizado del carrito
 * Responsabilidades:
 * - Agregar/eliminar/actualizar items
 * - Sincronización con backend (usuarios autenticados)
 * - Persistencia local (usuarios invitados)
 * - Cálculos de totales
 * - Estado del drawer del carrito
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      // ESTADO
      items: [],
      isCartOpen: false,
      isLoading: false,
      error: null,

      // COMPUTED VALUES (getters)
      get itemCount() {
        return get().items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      },

      get subtotal() {
        return get().items.reduce(
          (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
          0,
        );
      },

      // SYNC CON BACKEND
      syncCartWithBackend: async () => {
        const { isAuthenticated } = useAuthStore.getState();

        // Si no está autenticado, no hacer nada (usa persistencia local)
        if (!isAuthenticated) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Obtener items locales (de invitado)
          const localItems = get().items;

          // Si hay items locales, migrarlos al backend
          if (localItems.length > 0) {
            for (const item of localItems) {
              const qty = Math.max(1, Number(item.quantity) || 1);
              await api.cart.addItem(item.id, qty).catch(() => {});
            }
          }

          // Recargar del servidor como fuente de verdad
          const { data } = await api.cart.get();
          const serverItems = Array.isArray(data.items)
            ? data.items.map(mapServerItem)
            : [];

          set({ items: serverItems, isLoading: false });
        } catch (error) {
          console.error("Error al sincronizar carrito:", error);
          set({
            error: error?.message || "Error al sincronizar carrito",
            isLoading: false,
          });
        }
      },

      // AGREGAR ITEM
      addItem: async (product) => {
        const { isAuthenticated } = useAuthStore.getState();

        // Actualización (UI primero)
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);
          const stock =
            typeof product.stock === "number" ? product.stock : Infinity;

          if (existing) {
            const nextQty = Math.min((existing.quantity || 0) + 1, stock);
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, quantity: nextQty } : i,
              ),
            };
          }

          const initialQty = Math.min(1, stock);
          if (initialQty <= 0) return state;

          return {
            items: [...state.items, { ...product, quantity: initialQty }],
          };
        });

        // Sincronizar con backend si está autenticado
        if (isAuthenticated) {
          try {
            const { data } = await api.cart.addItem(product.id, 1);

            // Actualizar con datos reales del servidor
            if (data?.item) {
              const serverItem = mapServerItem(data.item);
              set((state) => ({
                items: [
                  ...state.items.filter((i) => i.id !== serverItem.id),
                  serverItem,
                ],
              }));
            } else {
              // refrescar todo
              await get().syncCartWithBackend();
            }
          } catch (error) {
            console.error("Error al agregar item:", error);
            // Revertir cambio en caso de error
            await get().syncCartWithBackend();
          }
        }
      },

      // ELIMINAR ITEM
      removeItem: async (productId) => {
        const { isAuthenticated } = useAuthStore.getState();
        const item = get().items.find((i) => i.id === productId);

        // Actualización optimista
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        }));

        // Sincronizar con backend si está autenticado
        if (isAuthenticated && item?.cartItemId) {
          try {
            await api.cart.removeItem(item.cartItemId);
          } catch (error) {
            console.error("Error al eliminar item:", error);
            // Revertir optimista
            await get().syncCartWithBackend();
          }
        }
      },

      // ACTUALIZAR CANTIDAD
      updateQuantity: async (productId, quantity) => {
        const { isAuthenticated } = useAuthStore.getState();
        const qty = Math.max(0, Number(quantity) || 0);

        // Si qty es 0, eliminar el item
        if (qty <= 0) {
          return get().removeItem(productId);
        }

        // Actualización
        set((state) => {
          const product = state.items.find((i) => i.id === productId);
          const stock =
            product && typeof product.stock === "number"
              ? product.stock
              : Infinity;
          const clamped = Math.min(qty, stock);

          return {
            items: state.items.map((i) =>
              i.id === productId ? { ...i, quantity: clamped } : i,
            ),
          };
        });

        // Sincronizar con backend si está autenticado
        const item = get().items.find((i) => i.id === productId);
        if (isAuthenticated && item?.cartItemId) {
          try {
            await api.cart.updateItem(item.cartItemId, qty);
          } catch (error) {
            console.error("Error al actualizar cantidad:", error);
            // Revertir cambio
            await get().syncCartWithBackend();
          }
        }
      },

      //  LIMPIAR CARRITO
      clearCart: async () => {
        const { isAuthenticated } = useAuthStore.getState();

        // Limpiar localmente
        set({ items: [], isLoading: false, error: null });

        // Sincronizar con backend si está autenticado
        if (isAuthenticated) {
          try {
            await api.cart.clear();
          } catch (error) {
            console.error("Error al limpiar carrito:", error);
          }
        }
      },

      // UI DEL CARRITO
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      // CLEAR ERROR
      clearError: () => set({ error: null }),
    }),
    {
      name: "cart-storage", // Nombre en localStorage
      partialize: (state) => ({
        // Solo persistir items para usuarios invitados
        // (usuarios autenticados usan backend)
        items: state.items,
      }),
      // Sincronizar con backend cuando se hidrata el store
      onRehydrateStorage: () => (state) => {
        if (state) {
          const { isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated) {
            state.syncCartWithBackend();
          }
        }
      },
    },
  ),
);

// CUSTOM SELECTORS

//Hook para obtener solo los items del carrito
export const useCartItems = () => useCartStore((state) => state.items);

//Hook para obtener solo el contador de items
export const useCartItemCount = () => useCartStore((state) => state.itemCount);

//Hook para obtener solo el subtotal
export const useCartSubtotal = () => useCartStore((state) => state.subtotal);

//Hook para obtener solo el estado del drawer
export const useIsCartOpen = () => useCartStore((state) => state.isCartOpen);

//Hook para obtener solo las acciones (sin estado)
export const useCartActions = () =>
  useCartStore((state) => ({
    addItem: state.addItem,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    clearCart: state.clearCart,
    openCart: state.openCart,
    closeCart: state.closeCart,
    toggleCart: state.toggleCart,
    syncCartWithBackend: state.syncCartWithBackend,
  }));
