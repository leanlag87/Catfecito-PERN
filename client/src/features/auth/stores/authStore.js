import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../../../services/api";

/**
 * Auth Store - Manejo centralizado de autenticación
 *
 * Responsabilidades:
 * - Login/Register/Logout
 * - Persistencia de token y usuario
 * - Verificación de autenticación
 * - Estado de carga y errores
 * - Disparo de eventos para sincronización global (authChanged)
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ESTADO

      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // LOGIN
      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const { data } = await api.auth.login(credentials);

          if (!data?.token || !data?.user) {
            throw new Error("Respuesta de login inválida");
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Disparar evento para componentes que escuchan authChanged
          window.dispatchEvent(new Event("authChanged"));

          return { success: true, data };
        } catch (error) {
          const errorMessage = error?.message || "Error al iniciar sesión";

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          return { success: false, error: errorMessage };
        }
      },

      // REGISTER
      register: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const { data } = await api.auth.register(userData);

          if (!data?.token || !data?.user) {
            throw new Error("Respuesta de registro inválida");
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Disparar evento
          window.dispatchEvent(new Event("authChanged"));

          return { success: true, data };
        } catch (error) {
          const errorMessage = error?.message || "Error al registrarse";

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          return { success: false, error: errorMessage };
        }
      },

      // LOGOUT
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });

        // Limpiar sessionStorage/localStorage legacy (migración)
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("authUser");

        // Disparar evento
        window.dispatchEvent(new Event("authChanged"));

        // Redirigir al home
        window.location.href = "/";
      },

      // CHECK AUTH (verificar token válido)
      checkAuth: async () => {
        const { token } = get();

        if (!token) {
          set({ isAuthenticated: false });
          return false;
        }

        set({ isLoading: true });

        try {
          // Verificar token con el backend
          const { data } = await api.auth.verify();

          if (data?.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          } else {
            throw new Error("Token inválido");
          }
        } catch (error) {
          console.error("Token inválido o expirado:", error);

          // Token inválido → logout
          get().logout();
          return false;
        }
      },

      // UPDATE USER actualizar perfil
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      // CLEAR ERROR
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage", // Nombre en localStorage
      partialize: (state) => ({
        // Solo persistir estos campos
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

//CUSTOM SELECTORS
//Hook para obtener solo el usuario
export const useUser = () => useAuthStore((state) => state.user);

//Hook para obtener solo el estado de autenticación
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);

//Hook para obtener solo el loading
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

//Hook para obtener solo acciones (sin estado)
export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    register: state.register,
    logout: state.logout,
    checkAuth: state.checkAuth,
  }));
