import React from 'react';
import './ProductCard.css';

export const ProductCard = ({ product, onAddToCart = () => {} }) => {

  const handleAddToCart = () => {
    onAddToCart(product);
    console.log(`${product.name} añadido al carrito`);
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img 
          src={product.image || '/placeholder-coffee.jpg'} 
          alt={product.name}
        />
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        <div className="product-price">
          <span className="current-price">${product.price.toLocaleString('es-CO')}</span>
        </div>
        
        <button 
          className={`product-button ${product.stock <= 0 ? 'disabled' : ''}`}
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          title={product.stock <= 0 ? 'Sin stock' : 'Añadir al carrito'}
        >
          {product.stock <= 0 ? 'Agotado' : 'Añadir al carrito'}
        </button>
      </div>
    </div>
  );
};