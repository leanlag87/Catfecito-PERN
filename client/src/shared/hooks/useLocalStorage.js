import { useCallback, useEffect, useState } from "react";

//Sincroniza un estado de React con localStorage (lectura, escritura y eliminación)
export const useLocalStorage = (key, initialValue) => {
  const readValue = useCallback(() => {
    if (typeof window === "undefined" || !key) return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [value, setValue] = useState(readValue);

  const setStoredValue = useCallback(
    (nextValue) => {
      setValue((prev) => {
        const resolved =
          typeof nextValue === "function" ? nextValue(prev) : nextValue;

        try {
          if (typeof window !== "undefined" && key) {
            window.localStorage.setItem(key, JSON.stringify(resolved));
          }
        } catch {
          // noop
        }

        return resolved;
      });
    },
    [key],
  );

  const removeStoredValue = useCallback(() => {
    try {
      if (typeof window !== "undefined" && key) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // noop
    }
    setValue(initialValue);
  }, [key, initialValue]);

  useEffect(() => {
    setValue(readValue());
  }, [readValue]);

  return [value, setStoredValue, removeStoredValue];
};
