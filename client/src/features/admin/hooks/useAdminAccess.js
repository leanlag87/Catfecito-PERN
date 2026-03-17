import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/stores/authStore";
import { useAdminStore } from "../stores/adminStore";

export const useAdminAccess = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { isLoading, error, checkAdminAccess, clearError } = useAdminStore();

  const [hasChecked, setHasChecked] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);

  const ensureAccess = useCallback(async () => {
    clearError?.();

    if (!isAuthenticated) {
      setIsAllowed(false);
      setHasChecked(true);
      navigate("/login", { replace: true });
      return false;
    }

    // Atajo por rol en cliente (si existe)
    if (user?.role === "admin") {
      setIsAllowed(true);
      setHasChecked(true);
      return true;
    }

    // Validación real contra backend/store
    const result = await checkAdminAccess?.();
    const ok =
      result?.success !== false &&
      (result?.isAdmin === true || result?.data?.isAdmin === true);

    setIsAllowed(!!ok);
    setHasChecked(true);

    if (!ok) {
      navigate("/", { replace: true });
      return false;
    }

    return true;
  }, [isAuthenticated, user?.role, checkAdminAccess, clearError, navigate]);

  useEffect(() => {
    ensureAccess();
  }, [ensureAccess]);

  return {
    isAllowed,
    hasChecked,
    isLoading,
    error,
    ensureAccess,
  };
};
