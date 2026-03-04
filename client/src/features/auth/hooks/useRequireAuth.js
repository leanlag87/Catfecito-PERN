import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

/**
 * Hook para proteger rutas que requieren autenticación
 * Redirige al login si no está autenticado
 *
 * @param {string} redirectTo - Ruta a la que redirigir si no está autenticado (default: '/login')
 * @returns {Object} { isAuthenticated, isLoading, user }
 *
 * @example
 *  En un componente:
 * function ProfilePage() {
 *   const { isLoading } = useRequireAuth();
 *
 *   if (isLoading) return <div>Cargando...</div>;
 *
 *   return <div>Perfil del usuario</div>;
 * }
 */

export const useRequireAuth = (redirectTo = "/login") => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    // Esperar a que termine de cargar el estado inicial
    if (isLoading) return;

    // Si no está autenticado, redirigir
    if (!isAuthenticated) {
      console.warn(
        "useRequireAuth: Usuario no autenticado, redirigiendo a",
        redirectTo,
      );
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return {
    isAuthenticated,
    isLoading,
    user,
  };
};
