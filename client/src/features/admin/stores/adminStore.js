import { create } from "zustand";
import api from "../../../services/api";
import { useAuthStore } from "../../auth/stores/authStore";

/**
 * Admin Store - Manejo centralizado de funciones administrativas
 *
 * Responsabilidades:
 * - CRUD de productos
 * - Gestión de categorías
 * - Gestión de órdenes (admin view)
 * - Estadísticas y reportes
 */
export const useAdminStore = create((set, get) => ({
  // Estado
  products: [],
  categories: [],
  allOrders: [],
  users: [],
  stats: null,
  isLoading: false,
  error: null,

  // Verificar permisos de admin
  checkAdminAccess: () => {
    const { user } = useAuthStore.getState();
    return user?.role === "admin";
  },

  // CRUD de Productos
  fetchAllProducts: async () => {
    if (!get().checkAdminAccess()) {
      set({ error: "No tienes permisos de administrador" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.products.getAll();

      set({
        products: data.products || [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error al cargar productos:", error);
      set({
        error: error?.message || "Error al cargar productos",
        isLoading: false,
      });
    }
  },

  createProduct: async (productData) => {
    if (!get().checkAdminAccess()) {
      return { success: false, error: "No tienes permisos de administrador" };
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.products.create(productData);

      set((state) => ({
        products: [...state.products, data.product],
        isLoading: false,
      }));

      return { success: true, data };
    } catch (error) {
      const errorMessage = error?.message || "Error al crear producto";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  updateProduct: async (productId, productData) => {
    if (!get().checkAdminAccess()) {
      return { success: false, error: "No tienes permisos de administrador" };
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.products.update(productId, productData);

      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? data.product : p,
        ),
        isLoading: false,
      }));

      return { success: true, data };
    } catch (error) {
      const errorMessage = error?.message || "Error al actualizar producto";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  deleteProduct: async (productId) => {
    if (!get().checkAdminAccess()) {
      return { success: false, error: "No tienes permisos de administrador" };
    }

    set({ isLoading: true, error: null });

    try {
      await api.products.delete(productId);

      set((state) => ({
        products: state.products.filter((p) => p.id !== productId),
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error?.message || "Error al eliminar producto";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Gestión de Categorías
  fetchCategories: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.categories.getAll();

      set({
        categories: data.categories || [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      set({
        error: error?.message || "Error al cargar categorías",
        isLoading: false,
      });
    }
  },

  createCategory: async (categoryData) => {
    if (!get().checkAdminAccess()) {
      return { success: false, error: "No tienes permisos de administrador" };
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.categories.create(categoryData);

      set((state) => ({
        categories: [...state.categories, data.category],
        isLoading: false,
      }));

      return { success: true, data };
    } catch (error) {
      const errorMessage = error?.message || "Error al crear categoría";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  updateCategory: async (categoryId, categoryData) => {
    if (!get().checkAdminAccess()) {
      return { success: false, error: "No tienes permisos de administrador" };
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.categories.update(categoryId, categoryData);

      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === categoryId ? data.category : c,
        ),
        isLoading: false,
      }));

      return { success: true, data };
    } catch (error) {
      const errorMessage = error?.message || "Error al actualizar categoría";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  deleteCategory: async (categoryId) => {
    if (!get().checkAdminAccess()) {
      return { success: false, error: "No tienes permisos de administrador" };
    }

    set({ isLoading: true, error: null });

    try {
      await api.categories.delete(categoryId);

      set((state) => ({
        categories: state.categories.filter((c) => c.id !== categoryId),
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error?.message || "Error al eliminar categoría";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Gestión de Órdenes (admin)
  fetchAllOrders: async () => {
    if (!get().checkAdminAccess()) {
      set({ error: "No tienes permisos de administrador" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.orders.getAll();

      set({
        allOrders: data.orders || [],
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

  updateOrderStatus: async (orderId, status) => {
    if (!get().checkAdminAccess()) {
      return { success: false, error: "No tienes permisos de administrador" };
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.orders.updateStatus(orderId, status);

      set((state) => ({
        allOrders: state.allOrders.map((o) =>
          o.id === orderId ? { ...o, status: data.order.status } : o,
        ),
        isLoading: false,
      }));

      return { success: true, data };
    } catch (error) {
      const errorMessage = error?.message || "Error al actualizar orden";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Estadísticas
  fetchStats: async () => {
    if (!get().checkAdminAccess()) {
      set({ error: "No tienes permisos de administrador" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.admin.getStats();

      set({
        stats: data.stats || null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      set({
        error: error?.message || "Error al cargar estadísticas",
        isLoading: false,
      });
    }
  },

  // Gestión de Usuarios (opcional)
  fetchAllUsers: async () => {
    if (!get().checkAdminAccess()) {
      set({ error: "No tienes permisos de administrador" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.users.getAll();

      set({
        users: data.users || [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      set({
        error: error?.message || "Error al cargar usuarios",
        isLoading: false,
      });
    }
  },

  // Limpiar error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => {
    set({
      products: [],
      categories: [],
      allOrders: [],
      users: [],
      stats: null,
      isLoading: false,
      error: null,
    });
  },
}));

// Custom selectors
export const useAdminProducts = () => useAdminStore((state) => state.products);
export const useAdminCategories = () =>
  useAdminStore((state) => state.categories);
export const useAdminOrders = () => useAdminStore((state) => state.allOrders);
export const useAdminStats = () => useAdminStore((state) => state.stats);
export const useAdminLoading = () => useAdminStore((state) => state.isLoading);

export const useAdminActions = () =>
  useAdminStore((state) => ({
    checkAdminAccess: state.checkAdminAccess,
    fetchAllProducts: state.fetchAllProducts,
    createProduct: state.createProduct,
    updateProduct: state.updateProduct,
    deleteProduct: state.deleteProduct,
    fetchCategories: state.fetchCategories,
    createCategory: state.createCategory,
    updateCategory: state.updateCategory,
    deleteCategory: state.deleteCategory,
    fetchAllOrders: state.fetchAllOrders,
    updateOrderStatus: state.updateOrderStatus,
    fetchStats: state.fetchStats,
    fetchAllUsers: state.fetchAllUsers,
  }));
