import { useEffect } from "react";

//Bloquea el scroll del body mientras `locked` sea true (útil para modales/drawers)
export const useBodyScrollLock = (locked = true) => {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!locked) return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    // Evita salto de layout cuando desaparece la scrollbar
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [locked]);
};
