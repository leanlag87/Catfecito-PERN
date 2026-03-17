import { useMemo, useState, useCallback } from "react";
import { useOrdersStore } from "../../orders/stores/ordersStore";
import {
  normalizeOrders,
  getRecentOrders,
  calculateOrdersStats,
} from "../../orders/services/orders.service";

export const useProfileOrders = () => {
  const {
    orders,
    isLoading,
    error,
    fetchOrders,
    fetchOrderById,
    cancelOrder,
    clearError,
  } = useOrdersStore();

  const [statusFilter, setStatusFilter] = useState("all");

  const normalizedOrders = useMemo(() => normalizeOrders(orders), [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return normalizedOrders;

    return normalizedOrders.filter((order) => {
      const payment = order.paymentStatus;
      const orderStatus = order.orderStatus;
      return payment === statusFilter || orderStatus === statusFilter;
    });
  }, [normalizedOrders, statusFilter]);

  const recentOrders = useMemo(
    () => getRecentOrders(normalizedOrders, 30),
    [normalizedOrders],
  );

  const stats = useMemo(
    () => calculateOrdersStats(normalizedOrders),
    [normalizedOrders],
  );

  const refresh = useCallback(async () => {
    return await fetchOrders();
  }, [fetchOrders]);

  const getById = useCallback(
    async (orderId) => {
      if (!orderId) return null;
      return await fetchOrderById(orderId);
    },
    [fetchOrderById],
  );

  const cancelById = useCallback(
    async (orderId) => {
      if (!orderId) return { success: false, error: "orderId requerido" };
      return await cancelOrder(orderId);
    },
    [cancelOrder],
  );

  return {
    // estado
    orders: filteredOrders,
    allOrders: normalizedOrders,
    recentOrders,
    stats,
    isLoading,
    error,

    // filtro
    statusFilter,
    setStatusFilter,

    // acciones
    refresh,
    getById,
    cancelById,
    clearError,
  };
};
