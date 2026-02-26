import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../../auth/stores/authStore";
import { useOrdersStore } from "../../../orders/stores/ordersStore";
import "./ProfileOrders.css";

export default function ProfileOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");

  const { isAuthenticated } = useAuthStore();
  const {
    orders,
    fetchOrders,
    fetchOrderById,
    cancelOrder,
    createPaymentPreference,
    isLoading,
    error,
  } = useOrdersStore();

  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

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

    if (paymentStatus === "success" && orderId) {
      setSuccessMessage(`✅ ¡Pago completado exitosamente! Pedido #${orderId}`);
      setTimeout(() => {
        window.history.replaceState({}, "", "/profile/orders");
        setSuccessMessage("");
      }, 5000);
    } else if (paymentStatus === "pending" && orderId) {
      setSuccessMessage(`⏳ Tu pago está pendiente. Pedido #${orderId}`);
      setTimeout(() => {
        window.history.replaceState({}, "", "/profile/orders");
        setSuccessMessage("");
      }, 5000);
    }

    fetchOrders();
  }, [isAuthenticated, navigate, paymentStatus, orderId, fetchOrders]);

  const toggleOrderDetails = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    if (!orderDetails[orderId]) {
      const result = await fetchOrderById(orderId);

      if (result.success) {
        setOrderDetails((prev) => ({
          ...prev,
          [orderId]: result.data,
        }));
      } else {
        console.error("Error al obtener detalles:", result.error);
      }
    }

    setExpandedOrder(orderId);
  };

  const continuePayment = async (orderId) => {
    const result = await createPaymentPreference(orderId);

    if (result.success) {
      window.location.href = result.url;
    } else {
      alert(result.error || "No se pudo obtener la URL de pago.");
    }
  };

  const handleCancelOrder = async (orderId) => {
    const ok = window.confirm(
      "¿Seguro querés cancelar este pedido? Esta acción no se puede deshacer.",
    );
    if (!ok) return;

    const result = await cancelOrder(orderId);

    if (result.success) {
      if (orderDetails[orderId]) {
        setOrderDetails((prev) => ({
          ...prev,
          [orderId]: { ...prev[orderId], ...result.data.order },
        }));
      }
    } else {
      alert(result.error || "No se pudo cancelar el pedido");
    }
  };

  return (
    <section className="profile-orders">
      <div className="orders-header">
        <h2>Mis pedidos</h2>
      </div>

      {orders.some((o) => o.payment_status === "pending") && (
        <div className="pending-orders-banner">
          <h3>Tienes pagos pendientes</h3>
          {orders
            .filter((o) => o.payment_status === "pending")
            .map((o) => (
              <div key={o.id} className="pending-orders-info">
                <div>
                  <strong>Pedido pendiente: {o.id}</strong>
                </div>
                <div className="pending-actions">
                  <button onClick={() => continuePayment(o.id)}>
                    Continuar pago
                  </button>
                  <button onClick={() => handleCancelOrder(o.id)}>
                    Cancelar pedido
                  </button>
                  <small>Pedido pendiente — se cancelará en ~10 min</small>
                </div>
              </div>
            ))}
        </div>
      )}

      {successMessage && <div className="orders-success">{successMessage}</div>}
      {isLoading && <p>Cargando pedidos…</p>}
      {error && <div className="orders-error">{error}</div>}

      {!isLoading &&
        !error &&
        (orders.length === 0 ? (
          <p>No tienes pedidos todavía.</p>
        ) : (
          <ul className="orders-list">
            {orders.map((o) => (
              <li key={o.id} className="disponsal-item">
                <div className="disponsal-summary">
                  <div>
                    <strong>Pedido #{o.id}</strong>
                  </div>
                  <div>
                    Fecha:{" "}
                    {o.created_at
                      ? new Date(o.created_at).toLocaleString("es-AR")
                      : "-"}
                  </div>
                  <div>
                    Estado: {o.status}{" "}
                    {o.payment_status ? `(pago: ${o.payment_status})` : ""}
                  </div>
                  <div>
                    Total: ${Number(o.total || 0).toLocaleString("es-AR")}
                  </div>
                  <div
                    className="order-items-toggle"
                    onClick={() => toggleOrderDetails(o.id)}
                  >
                    Items: {o.items_count}
                    <span
                      className={`arrow ${expandedOrder === o.id ? "open" : ""}`}
                    >
                      ▼
                    </span>
                  </div>
                </div>

                {expandedOrder === o.id && (
                  <div className="order-details">
                    {orderDetails[o.id] ? (
                      <div className="details-content">
                        <div className="shipping-info">
                          <h4>Datos del envío</h4>
                          <p>{orderDetails[o.id].shipping_country}</p>
                          <p>{orderDetails[o.id].shipping_address}/</p>
                          <p>{orderDetails[o.id].shipping_city}</p>
                          <p>{orderDetails[o.id].shipping_state}</p>
                          <p>{orderDetails[o.id].shipping_zip}</p>
                          <p>Tel: {orderDetails[o.id].shipping_phone}</p>
                        </div>

                        <div className="purchase-info">
                          <h4>Datos de la compra</h4>
                          <ul className="purchase-list">
                            {orderDetails[o.id].items.map((item) => (
                              <li key={item.id} className="purchase-item">
                                <div className="purchase-text">
                                  <p>
                                    <strong>{item.product_name}</strong>
                                  </p>
                                  <p>Cantidad: {item.quantity}</p>
                                  <p>Precio: ${item.price}</p>
                                  <p>Subtotal: ${item.subtotal}</p>
                                </div>
                                <div className="purchase-image">
                                  <img
                                    src={getItemImageSrc(item)}
                                    alt={item.product_name}
                                  />
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p className="loading-details">Cargando detalles...</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
