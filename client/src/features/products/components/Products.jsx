import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../hooks";
import { useProductFilters } from "../hooks";
import { useCartStore } from "../../cart/stores/cartStore";
import { Header } from "../../../shared/components/Header/Header";
import { NavBar } from "../../../shared/components/NavBar/NavBar";
import { Breadcrumb } from "./Breadcrumb/Breadcrumb";
import { ProductBanner } from "./ProductBanner/ProductBanner";
import { ProductFilters } from "./ProductFilters/ProductFilters";
import { SortBar } from "./SortBart/SortBar";
import { ProductsList } from "./ProductList/ProductsList";
import { Footer } from "../../../shared/components/Footer/Footer";
import "./Products.css";

export const Products = ({ onOpenAuthModal }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Hook de productos wrapper del store
  const { fetchProducts, isLoading, error, hasProducts } = useProducts();

  // Hook de filtros con sincronización URL
  const {
    filters,
    filteredProducts,
    hasActiveFilters,
    activeFiltersCount,
    updateFilter,
    clearFilters,
    setSearch,
    setSortBy,
  } = useProductFilters({
    syncWithUrl: true,
    initialFilters: {
      category: "all",
      search: "",
      minPrice: null,
      maxPrice: null,
      sortBy: "name-asc",
      inStockOnly: false,
    },
  });

  // Store del carrito
  const {
    items: cartItems,
    itemCount,
    isCartOpen,
    addItem,
    removeItem,
    updateQuantity,
    openCart,
    closeCart,
  } = useCartStore();

  // Cargar productos al montar
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sincronizar búsqueda desde URL
  useEffect(() => {
    const searchQuery = searchParams.get("search") || "";
    if (searchQuery !== filters.search) {
      setSearch(searchQuery);
    }
  }, [searchParams, filters.search, setSearch]);

  // Manejar cambio de ordenamiento simplificado
  const handleSortChange = (sortValue) => {
    const sortMappings = {
      "title-ascending": "name-asc",
      "title-descending": "name-desc",
      "price-ascending": "price-asc",
      "price-descending": "price-desc",
      "created-ascending": "oldest",
      "created-descending": "newest",
      manual: "name-asc",
    };

    const mappedSort = sortMappings[sortValue] || "name-asc";
    setSortBy(mappedSort);
  };

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearch("");
    setSearchParams({});
  };

  // Manejar cambios en filtros avanzados
  const handleFiltersChange = (newFilters) => {
    // Actualizar categoría
    if (newFilters.category !== undefined) {
      updateFilter("category", newFilters.category);
    }

    // Actualizar rango de precios
    if (
      newFilters.minPrice !== undefined ||
      newFilters.maxPrice !== undefined
    ) {
      updateFilter("minPrice", newFilters.minPrice);
      updateFilter("maxPrice", newFilters.maxPrice);
    }

    // Actualizar solo en stock
    if (newFilters.inStockOnly !== undefined) {
      updateFilter("inStockOnly", newFilters.inStockOnly);
    }
  };

  // Obtener contadores para filtros
  const getCounts = () => {
    return {
      availability: {
        in_stock: filteredProducts.filter((p) => p.stock > 0).length,
        out_of_stock: filteredProducts.filter((p) => p.stock === 0).length,
      },
      grindType: {}, // Para futuras categorías
    };
  };

  return (
    <div className="products-page">
      <Header
        cartItems={cartItems}
        itemCount={itemCount}
        isCartOpen={isCartOpen}
        onOpenCart={openCart}
        onCloseCart={closeCart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onOpenAuthModal={onOpenAuthModal}
      />
      <NavBar />
      <Breadcrumb currentPage="Productos" />
      <ProductBanner />

      <div className="products-container">
        <ProductFilters
          onFiltersChange={handleFiltersChange}
          counts={getCounts()}
          activeFilters={filters}
          activeFiltersCount={activeFiltersCount}
        />

        <div className="products-main">
          <SortBar
            onSortChange={handleSortChange}
            searchQuery={filters.search}
            onClearSearch={handleClearSearch}
            resultsCount={filteredProducts.length}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Estado de carga */}
          {isLoading && (
            <div className="products-loading">
              <div className="spinner"></div>
              <p>Cargando productos...</p>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="products-error">
              <p>❌ {error}</p>
              <button onClick={fetchProducts}>Reintentar</button>
            </div>
          )}

          {/* Sin productos */}
          {!isLoading && !error && !hasProducts && (
            <div className="products-empty">
              <p>No hay productos disponibles</p>
            </div>
          )}

          {/* Sin resultados (filtros aplicados) */}
          {!isLoading &&
            !error &&
            hasProducts &&
            filteredProducts.length === 0 && (
              <div className="products-empty">
                <p>No se encontraron productos con los filtros aplicados</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn-clear-filters">
                    🗑️ Limpiar filtros ({activeFiltersCount})
                  </button>
                )}
              </div>
            )}

          {/* Lista de productos */}
          {!isLoading && !error && filteredProducts.length > 0 && (
            <ProductsList products={filteredProducts} onAddToCart={addItem} />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};
