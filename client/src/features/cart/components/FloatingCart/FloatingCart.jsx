import { useState, useEffect } from "react";
import { useCart } from "../../hooks";
import "./FloatingCart.css";
import cart from "../../../../assets/img/cart.svg";
import { Cart } from "../Cart";

export const FloatingCart = ({ onOpenAuthModal = null }) => {
  //  Usar hook de cart en lugar de props
  const {
    items,
    itemCount,
    isCartOpen,
    openCart,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.pageYOffset || window.scrollY || 0;
      const headerEl = document.querySelector("header");
      const headerHeight = headerEl?.offsetHeight || 50;

      setIsVisible(scrollY > headerHeight);
    };

    // Calcular visibilidad inicial
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mostrar botón solo si hay items y es visible
  const shouldShowButton = isVisible && itemCount > 0;

  return (
    <>
      {shouldShowButton && (
        <button
          className={`floating-cart visible`}
          onClick={openCart}
          title={`Carrito (${itemCount} ${itemCount === 1 ? "item" : "items"})`}
          aria-label={`Abrir carrito con ${itemCount} productos`}
        >
          <img src={cart} alt="Carrito flotante" />
          <span className="floating-cart-count">{itemCount}</span>
        </button>
      )}

      <Cart
        isOpen={isCartOpen}
        onClose={closeCart}
        cartItems={items}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onOpenAuthModal={onOpenAuthModal}
      />
    </>
  );
};
