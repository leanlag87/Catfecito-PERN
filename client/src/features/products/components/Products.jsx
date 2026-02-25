import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useProductsStore } from "../stores/productsStore";
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

  // Store de productos
  const {
    filteredProducts,
    filters,
    isLoading,
    fetchProducts,
    fetchCategories,
    setSearch,
    setSorting,
    clearFilters,
  } = useProductsStore();

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

  // Cargar productos y categorías al montar
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // Sincronizar búsqueda desde URL
  useEffect(() => {
    const searchQuery = searchParams.get("search") || "";
    if (searchQuery !== filters.search) {
      setSearch(searchQuery);
    }
  }, [searchParams, filters.search, setSearch]);

  const handleSortChange = (sortValue) => {
    const mappings = {
      "title-ascending": { field: "name", order: "asc" },
      "title-descending": { field: "name", order: "desc" },
      "price-ascending": { field: "price", order: "asc" },
      "price-descending": { field: "price", order: "desc" },
      "created-ascending": { field: "created_at", order: "asc" },
      "created-descending": { field: "created_at", order: "desc" },
      manual: { field: "name", order: "asc" },
    };

    const { field, order } = mappings[sortValue] || mappings.manual;
    setSorting(field, order);
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchParams({});
  };

  const handleFiltersChange = (newFilters) => {
    // Implementación pendiente conectar filtros avanzados al store
    console.log("Filtros cambiados:", newFilters);
  };

  const getCounts = () => {
    return {
      availability: {
        in_stock: filteredProducts.filter((p) => p.stock > 0).length,
        out_of_stock: filteredProducts.filter((p) => p.stock === 0).length,
      },
      grindType: {},
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
        />

        <div className="products-main">
          <SortBar
            onSortChange={handleSortChange}
            searchQuery={filters.search}
            onClearSearch={handleClearSearch}
          />

          {isLoading ? (
            <div className="products-loading">Cargando productos...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="products-empty">
              <p>No se encontraron productos</p>
              <button onClick={clearFilters}>Limpiar filtros</button>
            </div>
          ) : (
            <ProductsList products={filteredProducts} onAddToCart={addItem} />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};
