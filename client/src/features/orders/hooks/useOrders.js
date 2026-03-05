import { useOrdersStore } from "../stores/ordersStore";
import {
  normalizeOrders,
  calculateOrdersStats,
  getRecentOrders,
} from "../services/orders.service";

/**
 * Hook wrapper para acceso rápido al ordersStore
 * Simplifica el uso del store en componentes
 *
 * @example
 * const { orders, isLoading, fetchOrders, createOrder } = useOrders();
 */
export const useOrders = () => {
  const {
    orders,
    currentOrder,
    isLoading,
    error,
    createOrder,
    fetchOrders,
    fetchOrderById,
    cancelOrder,
    createPaymentPreference,
    getOrderById,
    getPendingOrders,
    clearCurrentOrder,
    clearError,
    reset,
  } = useOrdersStore();

  // Normalizar órdenes
  const normalizedOrders = normalizeOrders(orders);

  // Calcular estadísticas
  const stats = calculateOrdersStats(normalizedOrders);

  // Obtener órdenes recientes (últimos 30 días)
  const recentOrders = getRecentOrders(normalizedOrders, 30);

  // Obtener órdenes pendientes
  const pendingOrders = getPendingOrders();

  return {
    // Estado
    orders: normalizedOrders,
    currentOrder,
    isLoading,
    error,
    stats,
    recentOrders,
    pendingOrders,

    // Acciones
    createOrder,
    fetchOrders,
    fetchOrderById,
    cancelOrder,
    createPaymentPreference,
    getOrderById,
    clearCurrentOrder,
    clearError,
    reset,

    // Helpers
    hasOrders: normalizedOrders.length > 0,
    ordersCount: normalizedOrders.length,
    hasPendingOrders: pendingOrders.length > 0,
  };
};
