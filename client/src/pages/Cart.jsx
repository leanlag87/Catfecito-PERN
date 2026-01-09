import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";
import "./Cart.css";

export const Cart = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onOpenAuthModal = null,
}) => {
  const navigate = useNavigate();
  const [checkoutError, setCheckoutError] = useState("");
  const [mustLogin, setMustLogin] = useState(false);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const freeShippingThreshold = 36355;
  const isEligibleForFreeShipping = subtotal >= freeShippingThreshold;
  const amountForFreeShipping = freeShippingThreshold - subtotal;
  const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")
    : "";

  const getToken = () =>
    (
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      ""
    )
      .toString()
      .trim();

  const getItemImageSrc = (it) => {
    if (!it) return "";
    // Cambiar el nombre a estas variables para mayor claridad
    let v = it.image ?? it.image_url ?? "";
    // If object with url property
    if (v && typeof v === "object" && typeof v.url === "string") {
      v = v.url;
    }
    if (typeof v !== "string") return "";
    const src = v.trim();
    if (!src) return "";
    // Accept absolute URLs and data URLs
    if (src.startsWith("http") || src.startsWith("data:")) return src;
    // Ensure BACKEND_ORIGIN exists before concatenation
    if (!BACKEND_ORIGIN) return src;
    return `${BACKEND_ORIGIN}${src.startsWith("/") ? "" : "/"}${src}`;
  };

  const handleCheckout = () => {
    // Verificar si el usuario está autenticado
    const token = getToken();
    if (!token) {
      setCheckoutError("Debes iniciar sesión para continuar con el pago.");
      setMustLogin(true);
      return;
    }

    if (cartItems.length === 0) {
      alert("Tu carrito está vacío");
      return;
    }

    // Cerrar el carrito y redirigir a la página de checkout
    onClose();
    navigate("/checkout");
  };

  // Si el usuario inicia sesión vía modal mientras el carrito está abierto,
  // limpiar el aviso automáticamente cuando aparezca el token.
  useEffect(() => {
    if (mustLogin && getToken()) {
      setMustLogin(false);
      setCheckoutError("");
    }
    // también re-chequear al abrir el carrito
  }, [mustLogin, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-container" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Carrito ({cartItems.length})</h2>
          <button className="cart-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="cart-shipping-info">
          <div className="shipping-progress">
            <div
              className="progress-bar"
              style={{
                width: `${Math.min(
                  (subtotal / freeShippingThreshold) * 100,
                  100
                )}%`,
              }}
            ></div>
          </div>
          <p className="shipping-text">
            {isEligibleForFreeShipping ? (
              <>El envío es gratis 🎁</>
            ) : (
              <>
                Suma{" "}
                <strong>
                  ${amountForFreeShipping.toLocaleString("es-CO")}
                </strong>{" "}
                más para envío gratis 🎁
              </>
            )}
          </p>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  <img src={getItemImageSrc(item)} alt={item.name} />
                </div>

                <div className="item-details">
                  <h4 className="item-name">{item.name}</h4>
                  <p className="item-type">
                    Molido o grano: <span>Granos</span>
                  </p>
                  <p className="item-price">
                    ${item.price.toLocaleString("es-CO")}
                  </p>
                  {item.quantity > 1 && (
                    <p className="item-total">
                      Total:{" "}
                      <strong>
                        ${(item.price * item.quantity).toLocaleString("es-CO")}
                      </strong>
                    </p>
                  )}
                </div>

                <div className="item-controls">
                  <div className="quantity-controls">
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)
                      }
                      disabled={
                        typeof item.stock === "number" &&
                        item.quantity >= item.stock
                      }
                      title={
                        typeof item.stock === "number" &&
                        item.quantity >= item.stock
                          ? "Stock máximo alcanzado"
                          : "Incrementar"
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="remove-item"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="subtotal">
              <strong>
                Subtotal ({cartItems.length}) $
                {subtotal.toLocaleString("es-CO")}
              </strong>
            </div>

            <div className="checkout-buttons">
              {checkoutError && (
                <div
                  className="checkout-error"
                  style={{ color: "#b00020", marginBottom: 8 }}
                >
                  {checkoutError}
                </div>
              )}
              {mustLogin && (
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  {typeof onOpenAuthModal === "function" ? (
                    <button
                      className="btn-checkout"
                      onClick={() => {
                        onClose?.();
                        onOpenAuthModal("login");
                      }}
                    >
                      Iniciar sesión
                    </button>
                  ) : (
                    <button
                      className="btn-checkout"
                      onClick={() => {
                        onClose?.();
                        navigate("/login");
                      }}
                    >
                      Iniciar sesión
                    </button>
                  )}
                </div>
              )}
              <button className="btn-checkout" onClick={handleCheckout}>
                Pagar Pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
