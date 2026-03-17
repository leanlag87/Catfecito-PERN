import { useMemo, useState, useCallback, useEffect } from "react";
import { useAdminStore } from "../stores/adminStore";
import { normalizeOrdersAdmin } from "../services/admin.service";

export const useAdminOrders = () => {
  const {
    allOrders,
    isLoading,
    error,
    clearError,
    fetchAllOrders,
    fetchOrders,
    getAllOrders,
    updateOrderStatus,
    changeOrderStatus,
    updatePaymentStatus,
    changePaymentStatus,
  } = useAdminStore();

  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState("");

  const orders = useMemo(() => normalizeOrdersAdmin(allOrders), [allOrders]);

  useEffect(() => {
    const load = fetchAllOrders || fetchOrders || getAllOrders;
    if (typeof load === "function") load();
  }, [fetchAllOrders, fetchOrders, getAllOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const byStatus = statusFilter === "all" || o.status === statusFilter;
      const byPayment =
        paymentFilter === "all" || o.paymentStatus === paymentFilter;

      const q = search.trim().toLowerCase();
      const bySearch =
        !q ||
        String(o.id).includes(q) ||
        (o.userName || "").toLowerCase().includes(q) ||
        (o.userEmail || "").toLowerCase().includes(q);

      return byStatus && byPayment && bySearch;
    });
  }, [orders, statusFilter, paymentFilter, search]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const processing = orders.filter((o) => o.status === "processing").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;

    return { total, pending, processing, delivered, cancelled };
  }, [orders]);

  const refresh = useCallback(async () => {
    const load = fetchAllOrders || fetchOrders || getAllOrders;
    if (typeof load !== "function") {
      return { success: false, error: "No hay método para cargar órdenes" };
    }
    return await load();
  }, [fetchAllOrders, fetchOrders, getAllOrders]);

  const setOrderStatus = useCallback(
    async (orderId, status) => {
      if (!orderId) return { success: false, error: "orderId requerido" };
      if (!status) return { success: false, error: "status requerido" };

      const action = updateOrderStatus || changeOrderStatus;
      if (typeof action !== "function") {
        return {
          success: false,
          error: "No existe acción para actualizar estado de orden",
        };
      }

      return await action(orderId, status);
    },
    [updateOrderStatus, changeOrderStatus],
  );

  const setPaymentStatus = useCallback(
    async (orderId, paymentStatus) => {
      if (!orderId) return { success: false, error: "orderId requerido" };
      if (!paymentStatus) {
        return { success: false, error: "paymentStatus requerido" };
      }

      const action = updatePaymentStatus || changePaymentStatus;
      if (typeof action !== "function") {
        return {
          success: false,
          error: "No existe acción para actualizar estado de pago",
        };
      }

      return await action(orderId, paymentStatus);
    },
    [updatePaymentStatus, changePaymentStatus],
  );

  return {
    // estado
    orders: filteredOrders,
    allOrders: orders,
    isLoading,
    error,
    stats,

    // filtros
    statusFilter,
    paymentFilter,
    search,
    setStatusFilter,
    setPaymentFilter,
    setSearch,

    // acciones
    refresh,
    setOrderStatus,
    setPaymentStatus,
    clearError,
  };
};
