import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

/**
 * Hook para proteger rutas que requieren un rol específico
 * Redirige si el usuario no tiene el rol requerido
 *
 * @param {string|string[]} requiredRole - Rol(es) requerido(s)
 * @param {string} redirectTo - Ruta a la que redirigir si no tiene el rol (default: '/')
 * @returns {Object} { hasRole, isLoading, user }
 *
 * @example
 *  En AdminPanel:
 * function AdminPanel() {
 *   const { isLoading } = useRequireRole('admin', '/');
 *
 *   if (isLoading) return <div>Verificando permisos...</div>;
 *
 *   return <div>Panel de administración</div>;
 * }
 *
 * @example
 *  Múltiples roles:
 * useRequireRole(['admin', 'moderator']);
 */

export const useRequireRole = (requiredRole, redirectTo = "/") => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  // Verificar si el usuario tiene el rol requerido
  const hasRole = () => {
    if (!user || !user.role) return false;

    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }

    return user.role === requiredRole;
  };

  useEffect(() => {
    // Esperar a que termine de cargar
    if (isLoading) return;

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      console.warn(
        "useRequireRole: Usuario no autenticado, redirigiendo a /login",
      );
      navigate("/login", { replace: true });
      return;
    }

    // Si no tiene el rol requerido, redirigir
    if (!hasRole()) {
      console.warn(
        `useRequireRole: Usuario no tiene rol requerido (${requiredRole}), tiene: ${user?.role}`,
      );
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, user, requiredRole, navigate, redirectTo]);

  return {
    hasRole: hasRole(),
    isLoading,
    user,
  };
};
