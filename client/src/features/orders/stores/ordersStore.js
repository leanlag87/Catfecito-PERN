import { create } from "zustand";
import api from "../../../services/api";
import { useAuthStore } from "../../auth/stores/authStore";
import { useCartStore } from "../../cart/stores/cartStore";

/**
 * Orders Store - Manejo centralizado de órdenes
 *
 * Responsabilidades:
 * - Crear orden (checkout)
 * - Historial de órdenes del usuario
 * - Detalles de orden específica
 * - Cancelar orden
 * - Continuar pago pendiente
 */
export const useOrdersStore = create((set, get) => ({
  // Estado
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  // Crear nueva orden (checkout)
  createOrder: async (orderData) => {
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      return {
        success: false,
        error: "Debes iniciar sesión para crear una orden",
      };
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.orders.create(orderData);

      set((state) => ({
        orders: [data.order, ...state.orders],
        currentOrder: data.order,
        isLoading: false,
      }));

      // Limpiar carrito después de crear la orden
      const { clearCart } = useCartStore.getState();
      clearCart();

      return { success: true, data };
    } catch (error) {
      const errorMessage = error?.message || "Error al crear la orden";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Obtener órdenes del usuario
  fetchOrders: async () => {
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.orders.getMyOrders();

      set({
        orders: data.orders || [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
      set({
        error: error?.message || "Error al cargar órdenes",
        isLoading: false,
      });
    }
  },

  // Obtener detalles de una orden específica
  fetchOrderById: async (orderId) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.orders.getById(orderId);

      set({
        currentOrder: data.order,
        isLoading: false,
      });

      return { success: true, data: data.order };
    } catch (error) {
      const errorMessage = error?.message || "Error al cargar la orden";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Cancelar orden
  cancelOrder: async (orderId) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.orders.cancel(orderId);

      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? { ...order, ...data.order } : order,
        ),
        currentOrder:
          state.currentOrder?.id === orderId
            ? { ...state.currentOrder, ...data.order }
            : state.currentOrder,
        isLoading: false,
      }));

      return { success: true, data };
    } catch (error) {
      const errorMessage = error?.message || "Error al cancelar la orden";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Crear preferencia de pago para orden pendiente
  createPaymentPreference: async (orderId) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.payments.createPreference({
        order_id: orderId,
      });

      const url =
        data?.init_point || data?.preference?.init_point || data?.payment_url;

      set({ isLoading: false });

      if (url) {
        return { success: true, url };
      } else {
        throw new Error("No se pudo obtener la URL de pago");
      }
    } catch (error) {
      const errorMessage =
        error?.message || "Error al crear preferencia de pago";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Obtener orden por ID desde el estado local
  getOrderById: (orderId) => {
    return get().orders.find((order) => order.id === orderId);
  },

  // Obtener órdenes pendientes
  getPendingOrders: () => {
    return get().orders.filter((order) => order.payment_status === "pending");
  },

  // Limpiar orden actual
  clearCurrentOrder: () => {
    set({ currentOrder: null });
  },

  // Limpiar error
  clearError: () => {
    set({ error: null });
  },

  // Reset store (logout)
  reset: () => {
    set({
      orders: [],
      currentOrder: null,
      isLoading: false,
      error: null,
    });
  },
}));

// Custom selectors
export const useOrders = () => useOrdersStore((state) => state.orders);
export const useCurrentOrder = () =>
  useOrdersStore((state) => state.currentOrder);
export const useOrdersLoading = () =>
  useOrdersStore((state) => state.isLoading);
export const usePendingOrders = () =>
  useOrdersStore((state) => state.getPendingOrders());

export const useOrdersActions = () =>
  useOrdersStore((state) => ({
    createOrder: state.createOrder,
    fetchOrders: state.fetchOrders,
    fetchOrderById: state.fetchOrderById,
    cancelOrder: state.cancelOrder,
    createPaymentPreference: state.createPaymentPreference,
    getOrderById: state.getOrderById,
    clearCurrentOrder: state.clearCurrentOrder,
  }));
