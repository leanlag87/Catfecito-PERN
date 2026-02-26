import { create } from "zustand";
import api from "../../../services/api";

/**
 * Products Store - Manejo centralizado de productos
 *
 * Responsabilidades:
 * - Obtener productos del backend
 * - Filtrar por categoría, precio, búsqueda
 * - Ordenar productos
 * - Paginación
 * - Estado de carga y errores
 */
export const useProductsStore = create((set, get) => ({
  // ESTADO
  products: [],
  filteredProducts: [],
  categories: [],
  isLoading: false,
  error: null,

  // Filtros activos
  filters: {
    categoryId: null,
    search: "",
    minPrice: null,
    maxPrice: null,
  },

  // Ordenamiento
  sorting: {
    field: "name", // 'name' | 'price' | 'created_at'
    order: "asc", // 'asc' | 'desc'
  },

  // FETCH PRODUCTS

  fetchProducts: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.products.getAll();
      const products = data.products || [];

      set({
        products,
        filteredProducts: products,
        isLoading: false,
      });

      // Aplicar filtros si existen
      get().applyFilters();
    } catch (error) {
      console.error("Error al cargar productos:", error);
      set({
        error: error?.message || "Error al cargar productos",
        isLoading: false,
      });
    }
  },

  // FETCH CATEGORIES

  fetchCategories: async () => {
    try {
      const { data } = await api.categories.getAll();
      const categories = data.categories || [];

      set({ categories });
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  },

  //  SET FILTERS
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));

    // Aplicar filtros automáticamente
    get().applyFilters();
  },

  // Helpers individuales para filtros
  setCategory: (categoryId) => {
    get().setFilters({ categoryId });
  },

  setSearch: (search) => {
    get().setFilters({ search: search.trim() });
  },

  setPriceRange: (minPrice, maxPrice) => {
    get().setFilters({ minPrice, maxPrice });
  },

  clearFilters: () => {
    set({
      filters: {
        categoryId: null,
        search: "",
        minPrice: null,
        maxPrice: null,
      },
    });
    get().applyFilters();
  },

  // SET SORTING
  setSorting: (field, order) => {
    set({ sorting: { field, order } });
    get().applyFilters();
  },

  // APPLY FILTERS (lógica interna)
  applyFilters: () => {
    const { products, filters, sorting } = get();

    let filtered = [...products];

    // Filtrar por categoría
    if (filters.categoryId) {
      filtered = filtered.filter((p) => p.category_id === filters.categoryId);
    }

    // Filtrar por búsqueda (nombre o categoría)
    if (filters.search) {
      const normalize = (str) =>
        (str || "")
          .toString()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();

      const searchTerm = normalize(filters.search);

      filtered = filtered.filter(
        (p) =>
          normalize(p.name).includes(searchTerm) ||
          normalize(p.category_name).includes(searchTerm) ||
          normalize(p.description).includes(searchTerm),
      );
    }

    // Filtrar por rango de precio
    if (filters.minPrice !== null) {
      filtered = filtered.filter((p) => Number(p.price) >= filters.minPrice);
    }
    if (filters.maxPrice !== null) {
      filtered = filtered.filter((p) => Number(p.price) <= filters.maxPrice);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sorting.field) {
        case "price":
          aVal = Number(a.price) || 0;
          bVal = Number(b.price) || 0;
          break;
        case "created_at":
          aVal = new Date(a.created_at || 0);
          bVal = new Date(b.created_at || 0);
          break;
        case "name":
        default:
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
      }

      if (aVal < bVal) return sorting.order === "asc" ? -1 : 1;
      if (aVal > bVal) return sorting.order === "asc" ? 1 : -1;
      return 0;
    });

    set({ filteredProducts: filtered });
  },

  // GET PRODUCT BY ID
  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },

  // CLEAR ERROR
  clearError: () => set({ error: null }),
}));

//CUSTOM SELECTORS

//Hook para obtener solo los productos filtrados
export const useFilteredProducts = () =>
  useProductsStore((state) => state.filteredProducts);

//Hook para obtener solo las categorías

export const useCategories = () =>
  useProductsStore((state) => state.categories);

//Hook para obtener solo los filtros activos

export const useProductFilters = () =>
  useProductsStore((state) => state.filters);

//Hook para obtener solo el ordenamiento

export const useProductSorting = () =>
  useProductsStore((state) => state.sorting);

//Hook para obtener solo el estado de carga
export const useProductsLoading = () =>
  useProductsStore((state) => state.isLoading);

//Hook para obtener solo las acciones (sin estado)
export const useProductsActions = () =>
  useProductsStore((state) => ({
    fetchProducts: state.fetchProducts,
    fetchCategories: state.fetchCategories,
    setFilters: state.setFilters,
    setCategory: state.setCategory,
    setSearch: state.setSearch,
    setPriceRange: state.setPriceRange,
    clearFilters: state.clearFilters,
    setSorting: state.setSorting,
    getProductById: state.getProductById,
  }));
