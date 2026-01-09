import React, { useState, useEffect } from "react";
import "./FloatingCart.css";
import cart from "../../assets/img/cart.svg";
import { Cart } from "../../pages/Cart";

export const FloatingCart = ({
  items = [],
  itemCount = 0,
  isOpen = false,
  onOpenCart = () => {},
  onCloseCart = () => {},
  onUpdateQuantity = () => {},
  onRemoveItem = () => {},
  onClearCart = () => {},
  onOpenAuthModal = null
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.pageYOffset || window.scrollY || 0;
      const headerEl = document.querySelector("header");
      const headerHeight = (headerEl && headerEl.offsetHeight) ? headerEl.offsetHeight : 50;
      if (scrollY > headerHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // calcular visibilidad inicial
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mostrar botón solo si hay items y es visible; el modal se puede abrir siempre que isOpen sea true
  const hideButton = !isVisible || Number(itemCount) <= 0;

  return (
    <>
      {!hideButton && (
        <button 
          className={`floating-cart ${isVisible ? 'visible' : ''}`}
          onClick={onOpenCart}
          title={`Carrito (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
        >
          <img src={cart} alt="Carrito flotante" />
          <span className="floating-cart-count">{itemCount}</span>
        </button>
      )}

      <Cart 
        isOpen={isOpen}
        onClose={onCloseCart}
        cartItems={items}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
        onClearCart={onClearCart}
        onOpenAuthModal={onOpenAuthModal}
      />
    </>
  );
};