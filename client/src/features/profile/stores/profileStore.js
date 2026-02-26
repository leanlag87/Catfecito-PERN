import { create } from "zustand";
import api from "../../../services/api";
import { useAuthStore } from "../../auth/stores/authStore";

/**
 * Profile Store - Manejo centralizado del perfil de usuario
 *
 * Responsabilidades:
 * - Datos extendidos del usuario
 * - Direcciones de envío
 * - Órdenes del usuario
 * - Actualización de perfil
 */
export const useProfileStore = create((set, get) => ({
  // Estado
  profile: null,
  addresses: [],
  orders: [],
  isLoading: false,
  error: null,

  // Fetch perfil completo
  fetchProfile: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.users.getProfile();

      set({
        profile: data.user || null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      set({
        error: error?.message || "Error al cargar perfil",
        isLoading: false,
      });
    }
  },

  // Actualizar perfil
  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.users.updateProfile(profileData);

      set({
        profile: data.user || null,
        isLoading: false,
      });

      // Actualizar también en AuthStore
      const { updateUser } = useAuthStore.getState();
      updateUser(data.user);

      return { success: true, data };
    } catch (error) {
      const errorMessage = error?.message || "Error al actualizar perfil";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Fetch direcciones
  fetchAddresses: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    set({ isLoading: true, error: null });

    try {
      const { data } = await api.addresses.getAll();

      set({
        addresses: data.addresses || [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error al cargar direcciones:", error);
      set({
        error: error?.message || "Error al cargar direcciones",
        isLoading: false,
      });
    }
  },

  // Agregar dirección
  addAddress: async (addressData) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.addresses.create(addressData);

      set((state) => ({
        addresses: [...state.addresses, data.address],
        isLoading: false,
      }));

      return { success: true, data };
    } catch (error) {
      const errorMessage = error?.message || "Error al agregar dirección";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Actualizar dirección
  updateAddress: async (addressId, addressData) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.addresses.update(addressId, addressData);

      set((state) => ({
        addresses: state.addresses.map((addr) =>
          addr.id === addressId ? data.address : addr,
        ),
        isLoading: false,
      }));

      return { success: true, data };
    } catch (error) {
      const errorMessage = error?.message || "Error al actualizar dirección";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Eliminar dirección
  deleteAddress: async (addressId) => {
    set({ isLoading: true, error: null });

    try {
      await api.addresses.delete(addressId);

      set((state) => ({
        addresses: state.addresses.filter((addr) => addr.id !== addressId),
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error?.message || "Error al eliminar dirección";

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Fetch órdenes del usuario
  fetchOrders: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

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

  // Obtener orden por ID
  getOrderById: (orderId) => {
    return get().orders.find((order) => order.id === orderId);
  },

  // Limpiar error
  clearError: () => set({ error: null }),

  // Reset store (logout)
  reset: () => {
    set({
      profile: null,
      addresses: [],
      orders: [],
      isLoading: false,
      error: null,
    });
  },
}));

// Custom selectors
export const useProfile = () => useProfileStore((state) => state.profile);
export const useAddresses = () => useProfileStore((state) => state.addresses);
export const useOrders = () => useProfileStore((state) => state.orders);
export const useProfileLoading = () =>
  useProfileStore((state) => state.isLoading);

export const useProfileActions = () =>
  useProfileStore((state) => ({
    fetchProfile: state.fetchProfile,
    updateProfile: state.updateProfile,
    fetchAddresses: state.fetchAddresses,
    addAddress: state.addAddress,
    updateAddress: state.updateAddress,
    deleteAddress: state.deleteAddress,
    fetchOrders: state.fetchOrders,
    getOrderById: state.getOrderById,
  }));
