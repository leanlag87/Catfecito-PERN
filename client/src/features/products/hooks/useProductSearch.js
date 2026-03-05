import { useState, useEffect, useCallback, useRef } from "react";
import { useProductsStore } from "../stores/productsStore";

/**
 * Hook para manejar búsqueda de productos
 * Incluye debounce, historial y sugerencias
 *
 * @param {Object} options - Opciones de configuración
 * @param {number} options.debounceDelay - Delay en ms para debounce (default: 300)
 * @param {number} options.minChars - Caracteres mínimos para buscar (default: 2)
 * @param {boolean} options.saveHistory - Guardar historial en localStorage (default: true)
 * @param {number} options.maxHistoryItems - Máximo de items en historial (default: 10)
 * @returns {Object} Estado y métodos de búsqueda
 */
export const useProductSearch = (options = {}) => {
  const {
    debounceDelay = 300,
    minChars = 2,
    saveHistory = true,
    maxHistoryItems = 10,
  } = options;

  const { products, searchProducts: searchProductsStore } = useProductsStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState(() => {
    if (!saveHistory || typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem("product_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const debounceTimerRef = useRef(null);

  // Debounce del término de búsqueda
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceDelay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, debounceDelay]);

  // Ejecutar búsqueda cuando cambia el término debounced
  useEffect(() => {
    if (!debouncedTerm || debouncedTerm.length < minChars) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const searchLower = debouncedTerm.toLowerCase();
    const results = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.categoryName?.toLowerCase().includes(searchLower),
    );

    setSearchResults(results);
    setIsSearching(false);

    // Actualizar store
    searchProductsStore(debouncedTerm);
  }, [debouncedTerm, minChars, products, searchProductsStore]);

  // Guardar historial en localStorage
  useEffect(() => {
    if (!saveHistory || typeof window === "undefined") return;

    try {
      localStorage.setItem(
        "product_search_history",
        JSON.stringify(searchHistory),
      );
    } catch (error) {
      console.error("Error al guardar historial de búsqueda:", error);
    }
  }, [searchHistory, saveHistory]);

  // Actualizar término de búsqueda
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  // Limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedTerm("");
    setSearchResults([]);
    searchProductsStore("");
  }, [searchProductsStore]);

  // Agregar al historial
  const addToHistory = useCallback(
    (term) => {
      if (!term || term.length < minChars) return;

      setSearchHistory((prev) => {
        // Eliminar duplicados
        const filtered = prev.filter((item) => item !== term);

        // Agregar al inicio
        const updated = [term, ...filtered];

        // Limitar tamaño
        return updated.slice(0, maxHistoryItems);
      });
    },
    [minChars, maxHistoryItems],
  );

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setSearchHistory([]);

    if (typeof window !== "undefined") {
      localStorage.removeItem("product_search_history");
    }
  }, []);

  // Eliminar item del historial
  const removeFromHistory = useCallback((term) => {
    setSearchHistory((prev) => prev.filter((item) => item !== term));
  }, []);

  // Ejecutar búsqueda desde historial
  const searchFromHistory = useCallback(
    (term) => {
      setSearchTerm(term);
      addToHistory(term);
    },
    [addToHistory],
  );

  // Sugerencias primeras 5 coincidencias
  const suggestions = searchResults.slice(0, 5);

  return {
    // Estado
    searchTerm,
    debouncedTerm,
    isSearching,
    searchResults,
    searchHistory,
    suggestions,

    // Flags
    hasResults: searchResults.length > 0,
    hasHistory: searchHistory.length > 0,
    isMinChars: searchTerm.length >= minChars,

    // Acciones
    handleSearchChange,
    clearSearch,
    addToHistory,
    clearHistory,
    removeFromHistory,
    searchFromHistory,
  };
};
