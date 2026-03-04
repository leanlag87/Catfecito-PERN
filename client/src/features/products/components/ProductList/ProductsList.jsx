import { useMemo } from "react";
import { normalizeProducts } from "../../services/products.service";
import { ProductCard } from "../ProductCard/ProductCard";
import "./ProductsList.css";

export const ProductsList = ({ products, onAddToCart = () => {} }) => {
  // Normalizar productos para asegurar estructura consistente
  const normalizedProducts = useMemo(() => {
    return normalizeProducts(products);
  }, [products]);

  // Validación de productos vacíos
  if (!normalizedProducts || normalizedProducts.length === 0) {
    return (
      <div className="products-list">
        <div className="products-empty">
          <p>No hay productos para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-list">
      <div className="products-grid">
        {normalizedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
};
