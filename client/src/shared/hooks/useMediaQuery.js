import { useEffect, useState } from "react";

//Retorna true/false según si el viewport cumple una media query CSS
export const useMediaQuery = (query) => {
  const getMatches = () => {
    if (typeof window === "undefined" || !query) return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined" || !query) return;

    const mediaQueryList = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);

    // Valor inicial por si cambia entre render y effect
    setMatches(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", onChange);
      return () => mediaQueryList.removeEventListener("change", onChange);
    }

    // Fallback para navegadores antiguos
    mediaQueryList.addListener(onChange);
    return () => mediaQueryList.removeListener(onChange);
  }, [query]);

  return matches;
};
