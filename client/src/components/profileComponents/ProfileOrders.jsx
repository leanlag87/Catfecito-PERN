import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import "./ProfileOrders.css";

export default function ProfileOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  // Obtener las órdenes del usuario
  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
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

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get('/orders');
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
      } catch (e) {
        if (e?.response?.status === 401) {
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("authUser");
          navigate("/login");
          return;
        }
        setError(e?.response?.data?.message || "Error al obtener órdenes");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [navigate, paymentStatus, orderId]);

  // Expandir o colapsar pedido
  const toggleOrderDetails = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    if (!orderDetails[orderId]) {
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrderDetails((prev) => ({
          ...prev,
          [orderId]: data.order,
        }));
      } catch (err) {
        console.error("Error al obtener detalles:", err);
      }
    }

    setExpandedOrder(orderId);
  };

  const continuePayment = async (orderId) => {
    try {
      const { data } = await api.post('/payments/create-preference', { order_id: orderId });
      // mercado pago puede devolver init_point o preference.init_point según SDK/version
      const url = data?.init_point || data?.preference?.init_point || data?.payment_url;
      if (url) {
        window.location.href = url;
      } else {
        alert("No se pudo obtener la URL de pago.");
      }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Error al crear preferencia de pago");
    }
  };
  
  const cancelOrder = async (orderId) => {
    const ok = window.confirm("¿Seguro querés cancelar este pedido? Esta acción no se puede deshacer.");
    if (!ok) return;

    try {
      const { data } = await api.patch(`/orders/${orderId}/cancel`, {});

      // actualizar lista localmente
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o)));

      // si ya tenemos detalles cargados, actualizarlos también
      setOrderDetails((prev) => {
        if (!prev[orderId]) return prev;
        return { ...prev, [orderId]: { ...prev[orderId], ...data.order } };
      });
    } catch (err) {
      console.error("Error al cancelar pedido:", err);
      alert(err?.response?.data?.message || "No se pudo cancelar el pedido");
    }
  };

  return (
    <section className="profile-orders">
      <div className="orders-header">
        <h2>Mis pedidos</h2>
      </div>

      {orders.some(o => o.payment_status === 'pending') && (
        <div className="pending-orders-banner">
          <h3>Tienes pagos pendientes</h3>
          {orders
            .filter(o => o.payment_status === 'pending')
            .map(o => (
              <div key={o.id} className="pending-orders-info">
                <div><strong>Pedido pendiente: {o.id}</strong></div>
                <div className="pending-actions">
                  <button onClick={() => continuePayment(o.id)}>Continuar pago</button>
                  <button onClick={() => cancelOrder(o.id)}>Cancelar pedido</button>
                  <small>Pedido pendiente — se cancelará en ~10 min</small>
                </div>
              </div>
          ))}
        </div>
      )}

      {successMessage && <div className="orders-success">{successMessage}</div>}
      {loading && <p>Cargando pedidos…</p>}
      {error && <div className="orders-error">{error}</div>}

      {!loading && !error && (
        orders.length === 0 ? (
          <p>No tienes pedidos todavía.</p>
        ) : (
          <ul className="orders-list">
            {orders.map((o) => (
              <li key={o.id} className="disponsal-item">
                <div className="disponsal-summary">
                  <div><strong>Pedido #{o.id}</strong></div>
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
                                  <p><strong>{item.product_name}</strong></p>
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
        )
      )}
    </section>
  );
}