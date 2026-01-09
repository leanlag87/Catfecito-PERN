import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from '../services/api';
import "../styles/CustomBar.css";
import "../styles/index.css";
import "../styles/App.css";
import "animate.css";
import "./Products.css";
import MetaData from "../components/ui/MetaData/MetaData";
import { Header } from "../components/CustomBarComponents/Header";
import { NavBar } from "../components/CustomBarComponents/NavBar";
import { ProductBanner } from "../components/ProductsComponents/ProductBanner";
import { Breadcrumb } from "../components/ProductsComponents/Breadcrumb";
import { ProductFilters } from "../components/ProductsComponents/ProductFilters";
import { SortBar } from "../components/ProductsComponents/SortBar";
import { ProductsList } from "../components/ProductsComponents/ProductsList";
import { Footer } from "../components/FooterComponent/Footer";

export const Products = ({ 
  cartItems = [],
  itemCount = 0,
  isCartOpen = false,
  onAddToCart = () => {},
  onRemoveItem = () => {},
  onUpdateQuantity = () => {},
  onOpenCart = () => {},
  onCloseCart = () => {}
  , onOpenAuthModal = null
}) => {
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('manual');

  // Productos vienen del backend
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get('/products', { signal: controller.signal });

        // Backend devuelve { success, products: [...] }
        const list = Array.isArray(data?.products) ? data.products : (Array.isArray(data) ? data : []);
        const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '') : '';
        const mapped = list.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          image: `${BACKEND_ORIGIN}${p.image_url}`,
          stock: typeof p.stock === 'number' ? p.stock : 0,
          // En el front 'type' = categoría
          type: p.category_name || ''
        }));
        setProducts(mapped);
      } catch (err) {
        if (err.name !== 'CanceledError') setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    return () => controller.abort();
  }, []);
  // Fuente única de productos: backend
  const dataSource = products;

  const handleFiltersChange = (newFilters) => {
    console.log('Filtros cambiados:', newFilters);
    setFilters(newFilters);
  };

  const handleSortChange = (sortValue) => {
    console.log('Ordenamiento cambiado:', sortValue);
    setSortBy(sortValue);
  };

  // Helpers para aplicar filtros y ordenamiento
  const normalize = React.useCallback((str) =>
    (str || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  , []);

  // Leer query param "search" y aplicarlo junto con los filtros existentes
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const searchParam = (urlParams.get('search') || '').trim();
  const navigate = useNavigate();

  const handleClearSearch = () => {
    const params = new URLSearchParams(location.search);
    params.delete('search');
    const search = params.toString() ? `?${params.toString()}` : '';
    navigate({ pathname: location.pathname, search });
  };

  const applyFilters = (products) => {
    let result = products;

    // Aplicar búsqueda de la barra (si existe)
    if (searchParam) {
      const q = normalize(searchParam);
      result = result.filter((p) =>
        normalize(p.name).includes(q) || normalize(p.type || '').includes(q)
      );
    }

    // Si no hay filtros adicionales, devolvemos el resultado ya filtrado por searchParam
    if (!filters || Object.keys(filters).length === 0) return result;

    return result.filter((p) => {
      // Disponibilidad
      if (filters.availability) {
        const { in_stock, out_of_stock } = filters.availability;
        if (in_stock && !out_of_stock) {
          if (!(p.stock > 0)) return false;
        } else if (!in_stock && out_of_stock) {
          if (!(p.stock === 0)) return false;
        } else if (!in_stock && !out_of_stock) {
          return true;
        }
      }

      // Precio
      if (typeof filters.priceMin === 'number') {
        if (p.price < filters.priceMin) return false;
      }
      if (typeof filters.priceMax === 'number' && filters.priceMax > 0) {
        if (p.price > filters.priceMax) return false;
      }

      // Tipo de molido
      if (Array.isArray(filters.grindType) && filters.grindType.length > 0) {
        const productType = normalize(p.type);
        const matchesType = filters.grindType.some((t) => {
          const sel = normalize(t);
          return productType.includes(sel);
        });
        if (!matchesType) return false;
      }

      return true;
    });
  };

  const applySort = (products) => {
    switch (sortBy) {
      case 'title-ascending':
        return [...products].sort((a, b) => a.name.localeCompare(b.name, 'es'));
      case 'title-descending':
        return [...products].sort((a, b) => b.name.localeCompare(a.name, 'es'));
      case 'price-ascending':
        return [...products].sort((a, b) => a.price - b.price);
      case 'price-descending':
        return [...products].sort((a, b) => b.price - a.price);
      case 'created-ascending':
        // No tenemos fecha de creación, usamos id como aproximación
        return [...products].sort((a, b) => a.id - b.id);
      case 'created-descending':
        return [...products].sort((a, b) => b.id - a.id);
      case 'manual':
      default:
        return products; // mantener orden original
    }
  };

  const moveOutOfStockToEnd = (products) => {
    const inStock = [];
    const outOfStock = [];
    products.forEach(p => (p.stock > 0 ? inStock : outOfStock).push(p));
    return [...inStock, ...outOfStock];
  };

  const visibleProducts = moveOutOfStockToEnd(applySort(applyFilters(dataSource)));

  // Aplica filtros excluyendo un "facet" específico para calcular conteos dinámicos
  const applyFiltersExcept = React.useCallback((products, exceptKey) => {
    const f = filters || {};
    return products.filter((p) => {
      // Disponibilidad
      if (exceptKey !== 'availability' && f.availability) {
        const { in_stock, out_of_stock } = f.availability;
        if (in_stock && !out_of_stock) {
          if (!(p.stock > 0)) return false;
        } else if (!in_stock && out_of_stock) {
          if (!(p.stock === 0)) return false;
        } else if (!in_stock && !out_of_stock) {
          return false;
        }
      }
      // Precio
      if (exceptKey !== 'priceMin' && typeof f.priceMin === 'number') {
        if (p.price < f.priceMin) return false;
      }
      if (exceptKey !== 'priceMax' && typeof f.priceMax === 'number' && f.priceMax > 0) {
        if (p.price > f.priceMax) return false;
      }
      // Tipo de molido
      if (exceptKey !== 'grindType' && Array.isArray(f.grindType) && f.grindType.length > 0) {
        const productType = normalize(p.type);
        const matchesType = f.grindType.some((t) => normalize(t) && productType.includes(normalize(t)));
        if (!matchesType) return false;
      }
      // (Sin filtro de origen)
      return true;
    });
  }, [filters, normalize]);

  // Listas base que usa el UI
  const UI_GRIND_TYPES = useMemo(() => ['Granos', 'Molido express / cápsulas', 'Molido Filtro', 'Molido Francesa', 'Molido Italiana'], []);

  // Conteos dinámicos por facet
  const counts = useMemo(() => {
  const availabilityBase = applyFiltersExcept(dataSource, 'availability');
    const inStock = availabilityBase.filter(p => p.stock > 0).length;
    const outOfStock = availabilityBase.filter(p => p.stock === 0).length;

  const grindBase = applyFiltersExcept(dataSource, 'grindType');
    const grindTypeCounts = {};
    UI_GRIND_TYPES.forEach(label => {
      const sel = normalize(label);
      grindTypeCounts[label] = grindBase.filter(p => normalize(p.type).includes(sel)).length;
    });

    return {
      availability: { in_stock: inStock, out_of_stock: outOfStock },
      grindType: grindTypeCounts
    };
  }, [applyFiltersExcept, dataSource, UI_GRIND_TYPES, normalize]);

  return (
    <>
      <MetaData title="Café de grano" />
      <Header
        cartItems={cartItems}
        itemCount={itemCount}
        isCartOpen={isCartOpen}
        onOpenCart={onOpenCart}
        onCloseCart={onCloseCart}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
        onOpenAuthModal={onOpenAuthModal}
      />
      <NavBar />
      <ProductBanner />
      <Breadcrumb />
      
      <div className="products-container">
        <aside className="products-sidebar">
          <ProductFilters 
            onFiltersChange={handleFiltersChange}
            counts={counts}
          />
        </aside>
        
        <main className="products-main">
          {loading && (
            <div style={{ marginBottom: 12, color: '#6b4a3e' }}>Cargando productos…</div>
          )}
          {error && (
            <div style={{ marginBottom: 12, color: '#b00020' }}>Error al cargar productos</div>
          )}
          {!loading && !error && dataSource.length === 0 && (
            <div style={{ marginBottom: 12, color: '#6b4a3e' }}>No hay productos disponibles.</div>
          )}
          <SortBar onSortChange={handleSortChange} searchQuery={searchParam} onClearSearch={handleClearSearch} />
          <ProductsList 
            products={visibleProducts} 
            onAddToCart={onAddToCart}
          />
          
        </main>
      </div>
      <Footer />
    </>
  );
};