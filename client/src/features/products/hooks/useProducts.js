import { useProductsStore } from "../stores/productsStore";

/**
 * Hook wrapper para acceso rápido al productsStore
 * Simplifica el uso del store en componentes
 *
 * @example
 * const { products, isLoading, fetchProducts } = useProducts();
 *
 * useEffect(() => {
 *   fetchProducts();
 * }, []);
 */
export const useProducts = () => {
  const {
    products,
    filteredProducts,
    selectedProduct,
    categories,
    filters,
    isLoading,
    error,
    fetchProducts,
    fetchProductById,
    fetchProductsByCategory,
    setFilters,
    clearFilters,
    searchProducts,
    sortProducts,
  } = useProductsStore();

  return {
    // Estado
    products,
    filteredProducts,
    selectedProduct,
    categories,
    filters,
    isLoading,
    error,

    // Acciones
    fetchProducts,
    fetchProductById,
    fetchProductsByCategory,
    setFilters,
    clearFilters,
    searchProducts,
    sortProducts,

    // Helpers
    hasProducts: products.length > 0,
    productsCount: products.length,
    filteredCount: filteredProducts.length,
  };
};
