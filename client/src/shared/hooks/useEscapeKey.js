import { useEffect } from "react";

//Ejecuta un callback cuando el usuario presiona la tecla Escape
export const useEscapeKey = (onEscape, enabled = true) => {
  useEffect(() => {
    if (!enabled || typeof onEscape !== "function") return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onEscape(event);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onEscape, enabled]);
};
