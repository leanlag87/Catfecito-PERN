import { useAuthStore } from "../stores/authStore";

/**
 * Hook wrapper para acceso rápido al authStore
 * Simplifica el uso del store en componentes
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  } = useAuthStore();

  return {
    // Estado
    user,
    token,
    isAuthenticated,
    isLoading,
    error,

    // Acciones
    login,
    register,
    logout,
    clearError,

    // Helpers
    isAdmin: user?.role === "admin",
    userName: user?.name || user?.email || "Usuario",
  };
};
