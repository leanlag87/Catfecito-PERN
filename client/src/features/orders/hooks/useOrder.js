import { useMemo, useCallback } from "react";
import { useOrdersStore } from "../stores/ordersStore";
import {
  normalizeOrder,
  formatOrderDate,
  formatOrderTotal,
  formatShippingAddress,
  formatShippingName,
  calculateOrderItemsTotal,
  calculateOrderItemsCount,
  canCancelOrder,
  canPayOrder,
} from "../services/orders.service";
import { getPaymentStatusInfo, getOrderStatusInfo } from "../constants";

/**
 * Hook para manejar una orden individual
 * Proporciona métodos y estado específico para una orden
 *
 * @param {string|number} orderId - ID de la orden
 * @returns {Object} Estado y métodos de la orden
 *
 * @example
 * const {
 *   isLoading,
 *   paymentStatus,
 *   orderStatus,
 *   canCancel,
 *   canPay,
 *   cancel,
 *   createPayment
 * } = useOrder(orderId);
 */
export const useOrder = (orderId) => {
  const {
    currentOrder,
    isLoading,
    error,
    fetchOrderById,
    cancelOrder,
    createPaymentPreference,
    getOrderById,
  } = useOrdersStore();

  // Obtener orden (desde currentOrder si coincide, sino desde lista)
  const order = useMemo(() => {
    if (
      currentOrder &&
      (currentOrder.id === orderId || currentOrder.id === parseInt(orderId))
    ) {
      return normalizeOrder(currentOrder);
    }

    const foundOrder = getOrderById(orderId);
    return foundOrder ? normalizeOrder(foundOrder) : null;
  }, [currentOrder, orderId, getOrderById]);

  // Info de estado de pago
  const paymentStatusInfo = useMemo(() => {
    if (!order) return null;
    return getPaymentStatusInfo(order.paymentStatus);
  }, [order]);

  // Info de estado de orden
  const orderStatusInfo = useMemo(() => {
    if (!order) return null;
    return getOrderStatusInfo(order.orderStatus);
  }, [order]);

  // Formatear fecha
  const formattedDate = useMemo(() => {
    if (!order) return "-";
    return formatOrderDate(order.createdAt, "medium");
  }, [order]);

  // Total formateado
  const formattedTotal = useMemo(() => {
    if (!order) return "$0";
    return formatOrderTotal(order);
  }, [order]);

  // Dirección de envío
  const shippingAddress = useMemo(() => {
    if (!order) return "";
    return formatShippingAddress(order);
  }, [order]);

  // Nombre completo del destinatario
  const recipientName = useMemo(() => {
    if (!order) return "";
    return formatShippingName(order);
  }, [order]);

  // Total de items
  const itemsTotal = useMemo(() => {
    if (!order) return 0;
    return calculateOrderItemsTotal(order.items);
  }, [order]);

  // Cantidad de items
  const itemsCount = useMemo(() => {
    if (!order) return 0;
    return calculateOrderItemsCount(order.items);
  }, [order]);

  // Verificar si se puede cancelar
  const canCancel = useMemo(() => {
    if (!order) return false;
    return canCancelOrder(order);
  }, [order]);

  // Verificar si se puede pagar
  const canPay = useMemo(() => {
    if (!order) return false;
    return canPayOrder(order);
  }, [order]);

  // Cargar orden si no está cargada
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    await fetchOrderById(orderId);
  }, [orderId, fetchOrderById]);

  // Cancelar orden
  const cancel = useCallback(async () => {
    if (!orderId || !canCancel) return;
    await cancelOrder(orderId);
  }, [orderId, canCancel, cancelOrder]);

  // Crear preferencia de pago
  const createPayment = useCallback(async () => {
    if (!orderId || !canPay) return;
    return await createPaymentPreference(orderId);
  }, [orderId, canPay, createPaymentPreference]);

  return {
    // Orden
    order,

    // Estados
    isLoading,
    error,
    exists: !!order,

    // Info de estados
    paymentStatusInfo,
    orderStatusInfo,

    // Datos formateados
    formattedDate,
    formattedTotal,
    shippingAddress,
    recipientName,

    // Cálculos
    itemsTotal,
    itemsCount,

    // Permisos
    canCancel,
    canPay,

    // Acciones
    fetchOrder,
    cancel,
    createPayment,

    // Helpers
    isPending: order?.paymentStatus === "pending",
    isApproved: order?.paymentStatus === "approved",
    isCancelled: order?.orderStatus === "cancelled",
    isDelivered: order?.orderStatus === "delivered",
  };
};
