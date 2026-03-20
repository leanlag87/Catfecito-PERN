import { useEffect } from "react";

//Ejecuta un callback cuando el usuario hace click/touch fuera del elemento referenciado
export const useClickOutside = (ref, onOutsideClick, enabled = true) => {
  useEffect(() => {
    if (!enabled || !ref?.current || typeof onOutsideClick !== "function")
      return;

    const handler = (event) => {
      const element = ref.current;
      if (!element) return;
      if (element.contains(event.target)) return;
      onOutsideClick(event);
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onOutsideClick, enabled]);
};
