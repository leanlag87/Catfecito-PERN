import { useCartStore } from "../stores/cartStore";
import {
  calculateSubtotal,
  calculateItemCount,
  getCartSummary,
} from "../services/cart.service";

/**
 * Hook wrapper para acceso rápido al cartStore
 * Simplifica el uso del store en componentes
 *
 * @example
 * const { items, itemCount, subtotal, addItem, removeItem } = useCart();
 */
export const useCart = () => {
  const {
    items,
    isCartOpen,
    isLoading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    syncCartWithBackend,
    clearError,
  } = useCartStore();

  // Calcular valores derivados usando services
  const itemCount = calculateItemCount(items);
  const subtotal = calculateSubtotal(items);
  const summary = getCartSummary(items);

  return {
    // Estado
    items,
    isCartOpen,
    isLoading,
    error,
    itemCount,
    subtotal,
    summary,

    // Acciones
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    syncCartWithBackend,
    clearError,

    // Helpers
    isEmpty: items.length === 0,
    hasItems: items.length > 0,
    isValid: summary.isValid,
  };
};
