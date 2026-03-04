import { useState, useEffect, useMemo } from "react";
import { useProductsStore } from "../stores/productsStore";
import {
  buildFilterQuery,
  parseFilterQuery,
  filterProducts as filterProductsService,
  sortProducts as sortProductsService,
  getPriceRange,
} from "../services/products.service";

/**
 * Hook para manejar filtros de productos
 * Incluye filtrado, ordenamiento y sincronización con URL
 *
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.syncWithUrl - Sincronizar filtros con URL query params
 * @param {Object} options.initialFilters - Filtros iniciales
 * @returns {Object} Estado y métodos de filtrado
 */
export const useProductFilters = (options = {}) => {
  const {
    syncWithUrl = false,
    initialFilters = {
      category: "all",
      search: "",
      minPrice: null,
      maxPrice: null,
      sortBy: "name-asc",
      inStockOnly: false,
    },
  } = options;

  const { products, setFilters: setStoreFilters } = useProductsStore();

  // Estado local de filtros
  const [filters, setFilters] = useState(() => {
    if (syncWithUrl && typeof window !== "undefined") {
      return parseFilterQuery(window.location.search);
    }
    return initialFilters;
  });

  // Sincronizar filtros con URL
  useEffect(() => {
    if (!syncWithUrl || typeof window === "undefined") return;

    const queryString = buildFilterQuery(filters);
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.replaceState({}, "", newUrl);
  }, [filters, syncWithUrl]);

  // Calcular productos filtrados
  const filteredProducts = useMemo(() => {
    let result = filterProductsService(products, filters);
    result = sortProductsService(result, filters.sortBy);
    return result;
  }, [products, filters]);

  // Calcular rango de precios disponible
  const priceRange = useMemo(() => {
    return getPriceRange(products);
  }, [products]);

  // Actualizar un filtro específico
  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Actualizar también el store
    setStoreFilters({ [key]: value });
  };

  // Actualizar múltiples filtros
  const updateFilters = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));

    setStoreFilters(newFilters);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters(initialFilters);
    setStoreFilters(initialFilters);
  };

  // Limpiar un filtro específico
  const clearFilter = (key) => {
    const defaultValue = initialFilters[key];
    updateFilter(key, defaultValue);
  };

  // Verificar si hay filtros aplicados
  const hasActiveFilters = useMemo(() => {
    return (
      filters.category !== "all" ||
      filters.search !== "" ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.inStockOnly === true
    );
  }, [filters]);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== "all") count++;
    if (filters.search !== "") count++;
    if (filters.minPrice !== null) count++;
    if (filters.maxPrice !== null) count++;
    if (filters.inStockOnly) count++;
    return count;
  }, [filters]);

  return {
    // Estado
    filters,
    filteredProducts,
    priceRange,
    hasActiveFilters,
    activeFiltersCount,

    // Acciones
    updateFilter,
    updateFilters,
    clearFilters,
    clearFilter,

    // Métodos específicos
    setCategory: (category) => updateFilter("category", category),
    setSearch: (search) => updateFilter("search", search),
    setPriceRange: (min, max) =>
      updateFilters({ minPrice: min, maxPrice: max }),
    setSortBy: (sortBy) => updateFilter("sortBy", sortBy),
    toggleInStockOnly: () => updateFilter("inStockOnly", !filters.inStockOnly),
  };
};
