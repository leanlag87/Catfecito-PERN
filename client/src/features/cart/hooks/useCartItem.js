import { useMemo, useCallback } from "react";
import { useCartStore } from "../stores/cartStore";
import {
  canAddMoreQuantity,
  getMaxAllowedQuantity,
  isItemAvailable,
  calculateItemTotal,
} from "../services/cart.service";

/**
 * Hook para manejar un item individual del carrito
 * Proporciona métodos y estado específico para un producto
 *
 * @param {string|number} productId - ID del producto
 * @returns {Object} Estado y métodos del item
 *
 * @example
 * const {
 *   item,
 *   quantity,
 *   total,
 *   canIncrease,
 *   increment,
 *   decrement,
 *   remove
 * } = useCartItem(product.id);
 */
export const useCartItem = (productId) => {
  const { items, addItem, removeItem, updateQuantity } = useCartStore();

  // Buscar el item en el carrito
  const item = useMemo(() => {
    return items.find((i) => i.id === productId);
  }, [items, productId]);

  // Verificar si el item está en el carrito
  const isInCart = useMemo(() => {
    return !!item;
  }, [item]);

  // Obtener cantidad actual
  const quantity = useMemo(() => {
    return item ? item.quantity : 0;
  }, [item]);

  // Calcular total del item
  const total = useMemo(() => {
    return item ? calculateItemTotal(item) : 0;
  }, [item]);

  // Verificar si se puede incrementar
  const canIncrease = useMemo(() => {
    if (!item) return false;
    return canAddMoreQuantity(item, 1);
  }, [item]);

  // Verificar si está disponible
  const isAvailable = useMemo(() => {
    if (!item) return true; // Si no está en carrito, asumir disponible
    return isItemAvailable(item);
  }, [item]);

  // Obtener cantidad máxima
  const maxQuantity = useMemo(() => {
    if (!item) return 0;
    return getMaxAllowedQuantity(item);
  }, [item]);

  // Incrementar cantidad
  const increment = useCallback(() => {
    if (!item || !canIncrease) return;

    const newQuantity = quantity + 1;
    updateQuantity(productId, newQuantity);
  }, [item, canIncrease, quantity, productId, updateQuantity]);

  // Decrementar cantidad
  const decrement = useCallback(() => {
    if (!item) return;

    const newQuantity = quantity - 1;

    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  }, [item, quantity, productId, updateQuantity, removeItem]);

  // Establecer cantidad específica
  const setQuantity = useCallback(
    (newQuantity) => {
      if (!item) return;

      const parsedQuantity = parseInt(newQuantity) || 0;

      if (parsedQuantity <= 0) {
        removeItem(productId);
      } else if (parsedQuantity <= maxQuantity) {
        updateQuantity(productId, parsedQuantity);
      } else {
        // Si excede el máximo, establecer al máximo
        updateQuantity(productId, maxQuantity);
      }
    },
    [item, maxQuantity, productId, updateQuantity, removeItem],
  );

  // Remover item
  const remove = useCallback(() => {
    removeItem(productId);
  }, [productId, removeItem]);

  // Agregar al carrito (si no está)
  const add = useCallback(
    (product) => {
      if (!isInCart) {
        addItem(product);
      }
    },
    [isInCart, addItem],
  );

  return {
    // Estado
    item,
    isInCart,
    quantity,
    total,
    maxQuantity,
    isAvailable,
    canIncrease,
    canDecrease: quantity > 1,

    // Acciones
    increment,
    decrement,
    setQuantity,
    remove,
    add,
  };
};
