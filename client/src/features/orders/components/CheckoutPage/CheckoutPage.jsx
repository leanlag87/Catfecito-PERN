import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../../auth/stores/authStore";
import { useCartStore } from "../../../cart/stores/cartStore";
import { useOrdersStore } from "../../stores/ordersStore";
import { useProfileStore } from "../../../profile/stores/profileStore";
import { UserHeader } from "../../../../shared/components/UserHeader/UserHeader";
import MetaData from "../../../../shared/components/MetaData/MetaData";
import api from "../../../../services/api";
import { CheckoutButton } from "../CheckoutButton/CheckoutButton";
import "./CheckoutPage.css";

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");

  const { isAuthenticated } = useAuthStore();
  const { items: cartItems, subtotal } = useCartStore();
  const { createOrder, createPaymentPreference } = useOrdersStore();
  const { profile, updateProfile } = useProfileStore();

  const [form, setForm] = useState({
    country: "Argentina",
    firstName: "",
    lastName: "",
    address: "",
    address2: "",
    zip: "",
    city: "",
    state: "Buenos Aires",
    phone: "",
  });

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [preferenceId, setPreferenceId] = useState(null);
  const [error, setError] = useState("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [saveAddress, setSaveAddress] = useState(false);

  const total = useMemo(() => subtotal, [subtotal]);

  const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")
    : "";

  const getItemImageSrc = (it) => {
    if (!it) return "";
    let v = it.image ?? it.image_url ?? "";
    if (v && typeof v === "object" && typeof v.url === "string") {
      v = v.url;
    }
    if (typeof v !== "string") return "";
    const src = v.trim();
    if (!src) return "";
    if (src.startsWith("http") || src.startsWith("data:")) return src;
    if (!BACKEND_ORIGIN) return src;
    return `${BACKEND_ORIGIN}${src.startsWith("/") ? "" : "/"}${src}`;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (paymentStatus === "failure" && orderId) {
      setError("El pago no se pudo completar. Por favor, intenta nuevamente.");
      window.history.replaceState({}, "", "/checkout");
    }

    if (paymentStatus === "success") {
      navigate("/profile/orders?payment=success&order_id=" + orderId);
    }
  }, [paymentStatus, orderId, navigate, isAuthenticated]);

  useEffect(() => {
    if (!profile) {
      setIsLoadingAddress(false);
      return;
    }

    const nameParts = (profile.name || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    setForm({
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
  }, [profile]);

  const isFormComplete = useMemo(() => {
    return !!(
      form.firstName &&
      form.lastName &&
      form.address &&
      form.city &&
      form.zip &&
      cartItems.length > 0 &&
      !isLoadingAddress
    );
  }, [form, cartItems.length, isLoadingAddress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    if (preferenceId) {
      console.warn(
        " Se modificaron datos después de crear la orden. Considera resetear.",
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !form.firstName ||
      !form.lastName ||
      !form.address ||
      !form.city ||
      !form.zip
    ) {
      setError("Por favor completa los campos requeridos.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    if (preferenceId) {
      return;
    }

    setIsCreatingOrder(true);

    try {
      // Guardar dirección si el usuario lo solicitó
      if (saveAddress) {
        await updateProfile({
          default_country: form.country,
          default_address: form.address,
          default_address2: form.address2,
          default_city: form.city,
          default_state: form.state,
          default_zip: form.zip,
          default_phone: form.phone,
        }).catch((e) => {
          console.log("No se pudo guardar la dirección (continuando):", e);
        });
      }

      // Crear orden con el store
      const orderResult = await createOrder({
        shipping_first_name: form.firstName,
        shipping_last_name: form.lastName,
        shipping_country: form.country,
        shipping_address: form.address,
        shipping_address2: form.address2,
        shipping_city: form.city,
        shipping_state: form.state,
        shipping_zip: form.zip,
        shipping_phone: form.phone,
      });

      if (!orderResult.success) {
        throw new Error(orderResult.error || "Error al crear la orden");
      }

      const createdOrderId = orderResult.data?.order?.id;
      if (!createdOrderId) throw new Error("No se obtuvo el ID de la orden");

      // Crear preferencia de pago con el store
      const paymentResult = await createPaymentPreference(createdOrderId);

      if (!paymentResult.success) {
        throw new Error(
          paymentResult.error || "Error al crear preferencia de pago",
        );
      }

      // Extraer preference_id de la respuesta
      const prefData = await api.post("/payments/create-preference", {
        order_id: createdOrderId,
      });

      setPreferenceId(prefData.data.preference_id);
    } catch (err) {
      setError(err.message || "Error al procesar el pago");
      console.error("Error en checkout:", err);
    } finally {
      setIsCreatingOrder(false);
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
                value={form.country}
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
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label>Apellidos</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Apellidos"
                />
              </div>
            </div>

            <div className="form-row">
              <label>Dirección</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Dirección"
              />
            </div>

            <div className="form-row">
              <label>Casa, apartamento, etc. (opcional)</label>
              <input
                name="address2"
                value={form.address2}
                onChange={handleChange}
                placeholder="Casa, apartamento, etc."
              />
            </div>

            <div className="form-row three">
              <div>
                <label className="label-postal">Código postal</label>
                <input
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  placeholder="Código postal"
                />
              </div>
              <div>
                <label>Ciudad</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <label>Provincia</label>
                <select name="state" value={form.state} onChange={handleChange}>
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
                value={form.phone}
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

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className={`submit-btn ${preferenceId ? "hidden" : ""}`}
              disabled={isCreatingOrder || preferenceId || isLoadingAddress}
            >
              {isLoadingAddress
                ? "Cargando..."
                : isCreatingOrder
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
                        <img src={getItemImageSrc(item)} alt={item.name} />
                        <div>
                          <div className="name">{item.name}</div>
                          <div className="unit-price">
                            ${Number(item.price).toLocaleString("es-AR")}
                          </div>
                        </div>
                      </div>
                      <div className="order-item-right">
                        <div className="qty-container">
                          <div className="qty">{item.quantity}</div>
                        </div>
                        <div className="subtotal">
                          $
                          {Number(item.price * item.quantity).toLocaleString(
                            "es-AR",
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="order-summary">
                <div className="row">
                  <span>
                    Subtotal ·{" "}
                    {cartItems.reduce((s, i) => s + (i.quantity || 0), 0)}{" "}
                    artículos
                  </span>
                  <strong>${Number(total).toLocaleString("es-AR")}</strong>
                </div>
                <div className="row">
                  <span>Retiro en tienda</span>
                  <strong>GRATIS</strong>
                </div>
                <div className="row total">
                  <span>Total</span>
                  <strong>ARS ${Number(total).toLocaleString("es-AR")}</strong>
                </div>

                {preferenceId ? (
                  <div style={{ marginTop: "1rem" }}>
                    <CheckoutButton
                      preferenceId={preferenceId}
                      onSuccess={() => console.log("✅ Pago iniciado")}
                      onError={(err) => {
                        console.error("Error en CheckoutButton:", err);
                        setError(err?.message || "Error en el botón de pago");
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
