import { useEffect, useState } from "react";

/**
 * Retrasa la actualización de un valor para evitar ejecuciones frecuentes
 * (útil en búsquedas, filtros o inputs con llamadas a API).
 */
export const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
