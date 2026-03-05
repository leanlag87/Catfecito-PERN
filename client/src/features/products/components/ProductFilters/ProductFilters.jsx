import { useState, useEffect } from "react";
import { getPriceRange } from "../../services/products.service";
import { useProductsStore } from "../../stores/productsStore";
import "./ProductFilters.css";

export const ProductFilters = ({
  onFiltersChange,
  counts,
  activeFilters = {},
  activeFiltersCount = 0,
}) => {
  const { products } = useProductsStore();

  // Calcular rango de precios dinámico desde productos
  const priceRange = getPriceRange(products);

  const [filters, setFilters] = useState({
    availability: {
      in_stock: activeFilters.inStockOnly || false,
      out_of_stock: false,
    },
    priceMin: activeFilters.minPrice ?? priceRange.min,
    priceMax: activeFilters.maxPrice ?? priceRange.max,
    grindType: [],
  });

  // Sincronizar con filtros externos
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      availability: {
        in_stock: activeFilters.inStockOnly || false,
        out_of_stock: false,
      },
      priceMin: activeFilters.minPrice ?? priceRange.min,
      priceMax: activeFilters.maxPrice ?? priceRange.max,
    }));
  }, [
    activeFilters.inStockOnly,
    activeFilters.minPrice,
    activeFilters.maxPrice,
    priceRange,
  ]);

  // Actualizar rango cuando cambian los productos
  useEffect(() => {
    if (priceRange.min > 0 && priceRange.max > 0) {
      setFilters((prev) => ({
        ...prev,
        priceMin: prev.priceMin || priceRange.min,
        priceMax: prev.priceMax || priceRange.max,
      }));
    }
  }, [priceRange]);

  const handleAvailabilityChange = (type) => {
    const newAvailability = {
      ...filters.availability,
      [type]: !filters.availability[type],
    };

    const newFilters = {
      ...filters,
      availability: newAvailability,
    };

    setFilters(newFilters);

    // Enviar en formato esperado por useProductFilters
    onFiltersChange &&
      onFiltersChange({
        inStockOnly: newAvailability.in_stock,
      });
  };

  const handlePriceChange = (field, value) => {
    const parsedValue = parseInt(value) || 0;
    const newFilters = {
      ...filters,
      [field]: parsedValue,
    };

    setFilters(newFilters);

    // Enviar ambos valores de precio
    onFiltersChange &&
      onFiltersChange({
        minPrice: field === "priceMin" ? parsedValue : filters.priceMin,
        maxPrice: field === "priceMax" ? parsedValue : filters.priceMax,
      });
  };

  const handleCheckboxChange = (category, value) => {
    const currentValues = filters[category];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    const newFilters = {
      ...filters,
      [category]: newValues,
    };

    setFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
  };

  const availabilityCounts = counts?.availability || {
    in_stock: 0,
    out_of_stock: 0,
  };

  const grindTypeCounts = counts?.grindType || {};

  const UI_GRIND_TYPES = [
    "Granos",
    "Molido express / cápsulas",
    "Molido Filtro",
    "Molido Francesa",
    "Molido Italiana",
  ];

  return (
    <div className="page-width-vertical-coll">
      <aside className="filter-disponibility" aria-labelledby="filter-title">
        <div className="wbblankinner">
          <div className="filter-header">
            <h2 id="filter-title">Filtrar</h2>
            {/* ✅ Contador de filtros activos */}
            {activeFiltersCount > 0 && (
              <span className="active-filters-badge" title="Filtros activos">
                {activeFiltersCount}
              </span>
            )}
          </div>

          <details className="filter-section" open>
            <summary className="filter-summary">Disponibilidad</summary>
            <div className="filter-body">
              <label className="filter-option">
                <input
                  type="checkbox"
                  name="availability"
                  value="in_stock"
                  checked={filters.availability.in_stock}
                  onChange={() => handleAvailabilityChange("in_stock")}
                />
                <span>
                  En existencia{" "}
                  <span className="count">({availabilityCounts.in_stock})</span>
                </span>
              </label>
              <label className="filter-option muted">
                <input
                  type="checkbox"
                  name="availability"
                  value="out_of_stock"
                  checked={filters.availability.out_of_stock}
                  onChange={() => handleAvailabilityChange("out_of_stock")}
                />
                <span>
                  Agotado{" "}
                  <span className="count">
                    ({availabilityCounts.out_of_stock})
                  </span>
                </span>
              </label>
            </div>
          </details>

          <details className="filter-section" open>
            <summary className="filter-summary">Precio</summary>
            <div className="filter-body price-filter">
              <div className="price-inputs">
                <input
                  type="number"
                  id="price-min"
                  value={filters.priceMin}
                  min={priceRange.min}
                  max={filters.priceMax}
                  placeholder={`Min: $${priceRange.min}`}
                  onChange={(e) =>
                    handlePriceChange("priceMin", e.target.value)
                  }
                />
                <input
                  type="number"
                  id="price-max"
                  value={filters.priceMax}
                  min={filters.priceMin}
                  max={priceRange.max}
                  placeholder={`Max: $${priceRange.max}`}
                  onChange={(e) =>
                    handlePriceChange("priceMax", e.target.value)
                  }
                />
              </div>
              <div className="range-wrap">
                <input
                  type="range"
                  id="range-min"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={filters.priceMin}
                  onChange={(e) =>
                    handlePriceChange("priceMin", e.target.value)
                  }
                />
                <input
                  type="range"
                  id="range-max"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={filters.priceMax}
                  onChange={(e) =>
                    handlePriceChange("priceMax", e.target.value)
                  }
                />
                <div className="range-track"></div>
              </div>
            </div>
          </details>

          <details className="filter-section" open>
            <summary className="filter-summary">Tipo de molido</summary>
            <div className="filter-body two-column">
              {UI_GRIND_TYPES.map((type) => (
                <label key={type} className="filter-option">
                  <input
                    type="checkbox"
                    checked={filters.grindType.includes(type)}
                    onChange={() => handleCheckboxChange("grindType", type)}
                  />
                  {type}{" "}
                  <span className="count">({grindTypeCounts[type] ?? 0})</span>
                </label>
              ))}
            </div>
          </details>
        </div>
      </aside>
    </div>
  );
};
