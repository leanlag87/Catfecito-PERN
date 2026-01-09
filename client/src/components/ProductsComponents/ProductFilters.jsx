import React, { useState } from 'react';
import './ProductFilters.css';

export const ProductFilters = ({ onFiltersChange, counts }) => {
  const [filters, setFilters] = useState({
    availability: { in_stock: true, out_of_stock: false },
    priceMin: 0,
    priceMax: 66155,
  grindType: []
  });

  const handleAvailabilityChange = (type) => {
    const newAvailability = {
      ...filters.availability,
      [type]: !filters.availability[type]
    };
    const newFilters = { ...filters, availability: newAvailability };
    setFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
  };

  const handlePriceChange = (field, value) => {
    const newFilters = { ...filters, [field]: parseInt(value) };
    setFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
  };

  const handleCheckboxChange = (category, value) => {
    const currentValues = filters[category];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    
    const newFilters = { ...filters, [category]: newValues };
    setFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
  };

  const availabilityCounts = counts?.availability || { in_stock: 0, out_of_stock: 0 };
  const grindTypeCounts = counts?.grindType || {};
  // sin origen

  const UI_GRIND_TYPES = ['Granos', 'Molido express / cápsulas', 'Molido Filtro', 'Molido Francesa', 'Molido Italiana'];
  // UI_ORIGINS eliminado

  return (
    <div className="page-width-vertical-coll">
      <aside className="filter-disponibility" aria-labelledby="filter-title">
        <div className="wbblankinner">
          <h2 id="filter-title">Filtrar</h2>

          <details className="filter-section" open>
            <summary className="filter-summary">Disponibilidad</summary>
            <div className="filter-body">
              <label className="filter-option">
                <input 
                  type="checkbox" 
                  name="availability" 
                  value="in_stock" 
                  checked={filters.availability.in_stock}
                  onChange={() => handleAvailabilityChange('in_stock')}
                />
                <span>En existencia <span className="count">({availabilityCounts.in_stock})</span></span>
              </label>
              <label className="filter-option muted">
                <input 
                  type="checkbox" 
                  name="availability" 
                  value="out_of_stock"
                  checked={filters.availability.out_of_stock}
                  onChange={() => handleAvailabilityChange('out_of_stock')}
                />
                <span>Agotado <span className="count">({availabilityCounts.out_of_stock})</span></span>
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
                  min="0"
                  onChange={(e) => handlePriceChange('priceMin', e.target.value)}
                />
                <input 
                  type="number" 
                  id="price-max" 
                  value={filters.priceMax} 
                  min="0"
                  onChange={(e) => handlePriceChange('priceMax', e.target.value)}
                />
              </div>
              <div className="range-wrap">
                <input 
                  type="range" 
                  id="range-min" 
                  min="0" 
                  max="66155" 
                  value={filters.priceMin}
                  onChange={(e) => handlePriceChange('priceMin', e.target.value)}
                />
                <input 
                  type="range" 
                  id="range-max" 
                  min="0" 
                  max="66155" 
                  value={filters.priceMax}
                  onChange={(e) => handlePriceChange('priceMax', e.target.value)}
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
                    onChange={() => handleCheckboxChange('grindType', type)}
                  />
                  {type} <span className="count">({grindTypeCounts[type] ?? 0})</span>
                </label>
              ))}
            </div>
          </details>

          {/* Se eliminó filtro de Origen */}
        </div>
      </aside>
    </div>
  );
};