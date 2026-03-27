import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProfileOrders } from "../hooks";
import {
  formatOrderDate,
  formatOrderTotal,
  formatShippingAddress,
} from "../../../orders/services/orders.service";
import "./ProfileOrders.css";

export const ProfileOrders = () => {
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");

  const {
    orders,
    isLoading,
    error,
    refresh,
    getById,
    cancelById,
    continuePaymentById,
  } = useProfileOrders();

  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")
    : "";

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.paymentStatus === "pending"),
    [orders],
  );

  const getItemImageSrc = (it) => {
    if (!it) return "";
    let v = it.image ?? it.image_url ?? "";
    if (v && typeof v === "object" && typeof v.url === "string") v = v.url;
    if (typeof v !== "string") return "";
    const src = v.trim();
    if (!src) return "";
    if (src.startsWith("http") || src.startsWith("data:")) return src;
    if (!BACKEND_ORIGIN) return src;
    return `${BACKEND_ORIGIN}${src.startsWith("/") ? "" : "/"}${src}`;
  };

  useEffect(() => {
    if (paymentStatus === "success" && orderId) {
      setSuccessMessage(`¡Pago completado exitosamente! Pedido #${orderId}`);
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

    refresh();
  }, [paymentStatus, orderId, refresh]);

  const toggleOrderDetails = async (id) => {
    if (expandedOrder === id) {
      setExpandedOrder(null);
      return;
    }

    if (!orderDetails[id]) {
      const result = await getById(id);
      const detail = result?.data || result?.order || result;
      if (detail) {
        setOrderDetails((prev) => ({ ...prev, [id]: detail }));
      }
    }

    setExpandedOrder(id);
  };

  const continuePayment = async (id) => {
    const result = await continuePaymentById(id);
    if (result?.success && result?.url) {
      window.location.href = result.url;
      return;
    }
    alert(result?.error || "No se pudo obtener la URL de pago.");
  };

  const handleCancelOrder = async (id) => {
    const ok = window.confirm(
      "¿Seguro querés cancelar este pedido? Esta acción no se puede deshacer.",
    );
    if (!ok) return;

    const result = await cancelById(id);
    if (!result?.success) {
      alert(result?.error || "No se pudo cancelar el pedido");
      return;
    }

    if (orderDetails[id]) {
      setOrderDetails((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...(result?.data?.order || {}) },
      }));
    }
  };

  return (
    <section className="profile-orders">
      <div className="orders-header">
        <h2>Mis pedidos</h2>
      </div>

      {pendingOrders.length > 0 && (
        <div className="pending-orders-banner">
          <h3>Tienes pagos pendientes</h3>
          {pendingOrders.map((o) => (
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
                  <div>Fecha: {formatOrderDate(o.createdAt, "medium")}</div>
                  <div>
                    Estado: {o.orderStatus}{" "}
                    {o.paymentStatus ? `(pago: ${o.paymentStatus})` : ""}
                  </div>
                  <div>Total: {formatOrderTotal(o)}</div>
                  <div
                    className="order-items-toggle"
                    onClick={() => toggleOrderDetails(o.id)}
                  >
                    Items: {o.items?.length || 0}
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
                          <p>
                            {formatShippingAddress(orderDetails[o.id]) || "-"}
                          </p>
                        </div>

                        <div className="purchase-info">
                          <h4>Datos de la compra</h4>
                          <ul className="purchase-list">
                            {(orderDetails[o.id].items || []).map((item) => (
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
};
