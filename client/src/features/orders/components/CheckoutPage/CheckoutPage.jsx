import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../../auth/stores/authStore";
import { useCart } from "../../../cart/hooks";
import { useOrderCheckout } from "../../hooks";
import { useProfileStore } from "../../../profile/stores/profileStore";
import { UserHeader } from "../../../../shared/components/UserHeader/UserHeader";
import MetaData from "../../../../shared/components/MetaData/MetaData";
import { CheckoutButton } from "../CheckoutButton/CheckoutButton";
import { formatCartItemImage } from "../../../cart/services/cart.service";
import { formatCartPrice } from "../../../cart/services/cart.service";
import "./CheckoutPage.css";

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");

  const { isAuthenticated } = useAuthStore();
  const { items: cartItems, subtotal, itemCount } = useCart();
  const { profile, updateProfile } = useProfileStore();

  // Hook de checkout
  const {
    shippingData,
    errors,
    checkoutError,
    isProcessing,
    updateShippingData,
    updateMultipleFields,
    processCheckout,
    clearErrors,
  } = useOrderCheckout();

  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [saveAddress, setSaveAddress] = useState(false);
  const [preferenceId, setPreferenceId] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Manejar respuesta de pago
  useEffect(() => {
    if (paymentStatus === "failure" && orderId) {
      clearErrors();
      // Mostrar error pero permitir reintentar
      window.history.replaceState({}, "", "/checkout");
    }

    if (paymentStatus === "success" && orderId) {
      navigate(`/profile/orders?payment=success&order_id=${orderId}`);
    }
  }, [paymentStatus, orderId, navigate, clearErrors]);

  // Cargar dirección del perfil
  useEffect(() => {
    if (!profile) {
      setIsLoadingAddress(false);
      return;
    }

    const nameParts = (profile.name || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    updateMultipleFields({
      country: profile.default_country || "Argentina",
      firstName: firstName,
      lastName: lastName,
      address: profile.default_address || "",
      address2: profile.default_address2 || "",
      zip: profile.default_zip || "",
      city: profile.default_city || "",
      state: profile.default_state || "Buenos Aires",
      phone: profile.default_phone || "",
    });

    setIsLoadingAddress(false);
  }, [profile, updateMultipleFields]);

  // Verificar si el formulario está completo
  const isFormComplete =
    shippingData.firstName &&
    shippingData.lastName &&
    shippingData.address &&
    shippingData.city &&
    shippingData.zip &&
    cartItems.length > 0 &&
    !isLoadingAddress;

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateShippingData(name, value);

    // Resetear preferencia si se modifica después de crearla
    if (preferenceId) {
      console.warn("Datos modificados. Considera resetear la orden.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (preferenceId) {
      return; // Ya hay una preferencia creada
    }

    // Guardar dirección si el usuario lo solicitó
    if (saveAddress) {
      await updateProfile({
        default_country: shippingData.country,
        default_address: shippingData.address,
        default_address2: shippingData.address2,
        default_city: shippingData.city,
        default_state: shippingData.state,
        default_zip: shippingData.zip,
        default_phone: shippingData.phone,
      }).catch((err) => {
        console.log("No se pudo guardar la dirección:", err);
      });
    }

    // Procesar checkout con hook
    const result = await processCheckout();

    if (result.success && result.preference?.preference_id) {
      setPreferenceId(result.preference.preference_id);
    }
  };

  return (
    <div className="checkout-page">
      <MetaData title="Pantalla de pago - Catfecito" />
      <div className="checkout-header-wrapper">
        <UserHeader />
      </div>

      <main className="checkout-content">
        <section className="checkout-left">
          <h2>Dirección de facturación</h2>
          <form className="shipping-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>País / Región</label>
              <select
                name="country"
                value={shippingData.country}
                onChange={handleChange}
              >
                <option>Argentina</option>
                <option>Colombia</option>
                <option>Chile</option>
                <option>Perú</option>
              </select>
            </div>

            <div className="form-row two">
              <div>
                <label>Nombre</label>
                <input
                  name="firstName"
                  value={shippingData.firstName}
                  onChange={handleChange}
                  placeholder="Nombre"
                />
                {errors.firstName && (
                  <span className="field-error">{errors.firstName}</span>
                )}
              </div>
              <div>
                <label>Apellidos</label>
                <input
                  name="lastName"
                  value={shippingData.lastName}
                  onChange={handleChange}
                  placeholder="Apellidos"
                />
                {errors.lastName && (
                  <span className="field-error">{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <label>Dirección</label>
              <input
                name="address"
                value={shippingData.address}
                onChange={handleChange}
                placeholder="Dirección"
              />
              {errors.address && (
                <span className="field-error">{errors.address}</span>
              )}
            </div>

            <div className="form-row">
              <label>Casa, apartamento, etc. (opcional)</label>
              <input
                name="address2"
                value={shippingData.address2}
                onChange={handleChange}
                placeholder="Casa, apartamento, etc."
              />
            </div>

            <div className="form-row three">
              <div>
                <label className="label-postal">Código postal</label>
                <input
                  name="zip"
                  value={shippingData.zip}
                  onChange={handleChange}
                  placeholder="CP"
                />
                {errors.zip && (
                  <span className="field-error">{errors.zip}</span>
                )}
              </div>
              <div>
                <label>Ciudad</label>
                <input
                  name="city"
                  value={shippingData.city}
                  onChange={handleChange}
                  placeholder="Ciudad"
                />
                {errors.city && (
                  <span className="field-error">{errors.city}</span>
                )}
              </div>
              <div>
                <label>Provincia</label>
                <select
                  name="state"
                  value={shippingData.state}
                  onChange={handleChange}
                >
                  <option>Buenos Aires</option>
                  <option>Córdoba</option>
                  <option>Santa Fe</option>
                  <option>Mendoza</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <label>Teléfono (opcional)</label>
              <input
                name="phone"
                value={shippingData.phone}
                onChange={handleChange}
                placeholder="Teléfono"
              />
            </div>

            <div className="form-row" style={{ marginTop: "1rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  style={{ width: "auto", cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px" }}>
                  Guardar esta dirección como predeterminada
                </span>
              </label>
            </div>

            {checkoutError && <div className="form-error">{checkoutError}</div>}

            <button
              type="submit"
              className={`submit-btn ${preferenceId ? "hidden" : ""}`}
              disabled={isProcessing || preferenceId || isLoadingAddress}
            >
              {isLoadingAddress
                ? "Cargando..."
                : isProcessing
                  ? "Procesando..."
                  : "Continuar al pago"}
            </button>
          </form>
        </section>

        <aside className="checkout-right">
          <h3>Tu pedido</h3>
          {isLoadingAddress ? (
            <p>Cargando información...</p>
          ) : (
            <>
              <div className="order-items">
                {cartItems.length === 0 ? (
                  <p>No hay productos en el carrito.</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="order-item">
                      <div className="order-item-left">
                        <img
                          src={formatCartItemImage(item, BACKEND_URL)}
                          alt={item.name}
                          loading="lazy"
                        />
                        <div>
                          <div className="name">{item.name}</div>
                          <div className="unit-price">
                            ${formatCartPrice(item.price)}
                          </div>
                        </div>
                      </div>
                      <div className="order-item-right">
                        <div className="qty-container">
                          <div className="qty">{item.quantity}</div>
                        </div>
                        <div className="subtotal">
                          ${formatCartPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="order-summary">
                <div className="row">
                  <span>Subtotal · {itemCount} artículos</span>
                  <strong>${formatCartPrice(subtotal)}</strong>
                </div>
                <div className="row">
                  <span>Retiro en tienda</span>
                  <strong>GRATIS</strong>
                </div>
                <div className="row total">
                  <span>Total</span>
                  <strong>ARS ${formatCartPrice(subtotal)}</strong>
                </div>

                {preferenceId ? (
                  <div style={{ marginTop: "1rem" }}>
                    <CheckoutButton
                      preferenceId={preferenceId}
                      onSuccess={() => console.log("✅ Pago iniciado")}
                      onError={(err) => {
                        console.error("Error en CheckoutButton:", err);
                        setPreferenceId(null);
                      }}
                    />
                  </div>
                ) : isFormComplete ? (
                  <div
                    className="pay-notice"
                    style={{
                      backgroundColor: "#e8f5e9",
                      color: "#2e7d32",
                      border: "1px solid #4caf50",
                    }}
                  >
                    <p>
                      ✓ Datos completos. Haz clic en "Continuar al pago" para
                      proceder.
                    </p>
                  </div>
                ) : (
                  <div className="pay-notice">
                    <p>Completa tus datos de envío para continuar</p>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </main>
    </div>
  );
};

export default CheckoutPage;
