import {
  formatPrice,
  getStockStatus,
  formatProductImage,
  isProductAvailable,
} from "../../services/products.service";
import "./ProductCard.css";

export const ProductCard = ({ product, onAddToCart = () => {} }) => {
  const stockStatus = getStockStatus(product.stock);
  const isAvailable = isProductAvailable(product);

  const handleAddToCart = () => {
    if (!isAvailable) return;

    onAddToCart(product);
    console.log(`${product.name} añadido al carrito`);
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img
          src={formatProductImage(
            product.image || product.imageUrl,
            "/placeholder-coffee.jpg",
          )}
          alt={product.name}
          loading="lazy"
        />

        {/* Badge de stock */}
        {stockStatus.status !== "in-stock" && (
          <span
            className={`stock-badge stock-badge--${stockStatus.status}`}
            style={{ backgroundColor: stockStatus.color }}
          >
            {stockStatus.label}
          </span>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>

        <div className="product-price">
          <span className="current-price">{formatPrice(product.price)}</span>
        </div>

        <button
          className={`product-button ${!isAvailable ? "disabled" : ""}`}
          onClick={handleAddToCart}
          disabled={!isAvailable}
          title={!isAvailable ? stockStatus.label : "Añadir al carrito"}
        >
          {!isAvailable ? stockStatus.label : "Añadir al carrito"}
        </button>
      </div>
    </div>
  );
};
