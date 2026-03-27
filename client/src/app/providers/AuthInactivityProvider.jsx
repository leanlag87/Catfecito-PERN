import { useEffect, useRef } from "react";
import { useAuthStore } from "../../features/auth/stores/authStore";

//Controla cierre de sesión por inactividad del usuario autenticado.
export const AuthInactivityProvider = ({
  children,
  enabled = true,
  maxInactiveMs = 600_000, // 10 min
  logoutDelayMs = 10_000, // 10 seg
  events = ["mousemove", "keydown", "click", "scroll"],
  onInactivityDetected,
}) => {
  const { isAuthenticated, logout } = useAuthStore();
  const inactivityTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const clearTimers = () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (logoutTimerRef.current) {
        window.clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };

    const handleInactivity = () => {
      if (typeof onInactivityDetected === "function") {
        onInactivityDetected();
      }

      logoutTimerRef.current = window.setTimeout(() => {
        logout();
      }, logoutDelayMs);
    };

    const resetTimer = () => {
      if (logoutTimerRef.current) {
        window.clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }

      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = window.setTimeout(
        handleInactivity,
        maxInactiveMs,
      );
    };

    events.forEach((evt) =>
      window.addEventListener(evt, resetTimer, { passive: true }),
    );
    resetTimer();

    return () => {
      clearTimers();
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [
    enabled,
    isAuthenticated,
    logout,
    maxInactiveMs,
    logoutDelayMs,
    events,
    onInactivityDetected,
  ]);

  return children;
};

export default AuthInactivityProvider;
