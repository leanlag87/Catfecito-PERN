import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/stores/authStore";
import { useFreeShipping } from "../hooks";
import {
  formatCartItemImage,
  formatCartPrice,
  calculateItemTotal,
  validateCartForCheckout,
} from "../services/cart.service";
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
  const { isAuthenticated } = useAuthStore();
  const [checkoutError, setCheckoutError] = useState("");
  const [mustLogin, setMustLogin] = useState(false);

  // Hook de envío gratis
  const {
    isEligible: isEligibleForFreeShipping,
    amountNeeded: amountForFreeShipping,
    progress,
  } = useFreeShipping(36355);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const handleCheckout = () => {
    // Verificar autenticación
    if (!isAuthenticated) {
      setCheckoutError("Debes iniciar sesión para continuar con el pago.");
      setMustLogin(true);
      return;
    }

    // Validar carrito
    const validation = validateCartForCheckout(cartItems);
    if (!validation.isValid) {
      setCheckoutError(validation.errors[0]);
      return;
    }

    // Cerrar carrito y redirigir
    onClose();
    navigate("/checkout");
  };

  // Limpiar error cuando el usuario se autentique
  useEffect(() => {
    if (mustLogin && isAuthenticated) {
      setMustLogin(false);
      setCheckoutError("");
    }
  }, [mustLogin, isAuthenticated]);

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-container" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Carrito ({cartItems.length})</h2>
          <button
            className="cart-close"
            onClick={onClose}
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>

        {/* Barra de envío gratis mejorada */}
        <div className="cart-shipping-info">
          <div className="shipping-progress">
            <div
              className="progress-bar"
              style={{ width: `${Math.min(progress, 100)}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
          <p className="shipping-text">
            {isEligibleForFreeShipping ? (
              <>El envío es gratis 🎁</>
            ) : (
              <>
                Suma <strong>${formatCartPrice(amountForFreeShipping)}</strong>{" "}
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
            cartItems.map((item) => {
              const itemTotal = calculateItemTotal(item);
              const canIncrease =
                typeof item.stock === "number"
                  ? item.quantity < item.stock
                  : true;

              return (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    <img
                      src={formatCartItemImage(item, BACKEND_URL)}
                      alt={item.name}
                      loading="lazy"
                    />
                  </div>

                  <div className="item-details">
                    <h4 className="item-name">{item.name}</h4>
                    <p className="item-type">
                      Molido o grano: <span>Granos</span>
                    </p>
                    <p className="item-price">${formatCartPrice(item.price)}</p>
                    {item.quantity > 1 && (
                      <p className="item-total">
                        Total: <strong>${formatCartPrice(itemTotal)}</strong>
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
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={!canIncrease}
                        title={
                          !canIncrease
                            ? "Stock máximo alcanzado"
                            : "Incrementar"
                        }
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="remove-item"
                      onClick={() => onRemoveItem(item.id)}
                      aria-label={`Eliminar ${item.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="subtotal">
              <strong>
                Subtotal ({cartItems.length}) $
                {formatCartPrice(
                  cartItems.reduce(
                    (sum, item) => sum + calculateItemTotal(item),
                    0,
                  ),
                )}
              </strong>
            </div>

            <div className="checkout-buttons">
              {checkoutError && (
                <div className="checkout-error">{checkoutError}</div>
              )}

              {mustLogin && (
                <div className="login-prompt">
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
