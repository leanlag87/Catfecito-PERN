import React, { useState } from 'react';
import './SortBar.css';

export const SortBar = ({ onSortChange, searchQuery = '', onClearSearch = null }) => {
  const [sortBy, setSortBy] = useState('manual');
  
  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    onSortChange && onSortChange(value);
  };

  const sortOptions = [
    { value: 'manual', label: 'Características' },
    { value: 'title-ascending', label: 'Alfabéticamente, A-Z' },
    { value: 'title-descending', label: 'Alfabéticamente, Z-A' },
    { value: 'price-ascending', label: 'Precio, menor a mayor' },
    { value: 'price-descending', label: 'Precio, mayor a menor' },
    { value: 'created-ascending', label: 'Fecha, más antiguo a más reciente' },
    { value: 'created-descending', label: 'Fecha, más reciente a más antiguo' }
  ];

  return (
    <div className="filter-right-bar">
      <div className="sortbar-row">
        {/* Left: search tag */}
        {searchQuery ? (
          <div className="search-tag" role="status">
            <span className="search-tag-label">Búsqueda:</span>
            <span className="search-tag-value">{searchQuery}</span>
            <button
              type="button"
              className="search-tag-clear"
              aria-label="Quitar filtro de búsqueda"
              onClick={() => onClearSearch && onClearSearch()}
            >
              ×
            </button>
          </div>
        ) : <div className="search-tag-placeholder" />}

        {/* Right: existing sort form */}
        <form className="facets-vertical-form" id="FacetSortForm">
          <p className="order-by">
            <label htmlFor="SortByCategory">Ordenar por:</label>
          </p>
          <div className="select">
            <select 
              name="sort-by" 
              className="sort-by-category" 
              id="SortByCategory" 
              value={sortBy}
              onChange={handleSortChange}
              aria-describedby="ally-refresh-page-message"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>
    </div>
  );
};