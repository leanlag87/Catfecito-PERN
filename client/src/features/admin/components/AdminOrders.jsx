import { useState } from "react";
import { useAdminOrders } from "../hooks";
import api from "../../../services/api";
import "../../profile/components/ProfileOrders/ProfileOrders.css";

export default function AdminOrders() {
  const {
    orders,
    isLoading,
    error,
    stats,
    statusFilter,
    paymentFilter,
    search,
    setStatusFilter,
    setPaymentFilter,
    setSearch,
    setOrderStatus,
    setPaymentStatus,
  } = useAdminOrders();

  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")
    : "";

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

  const toggleOrderDetails = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    if (!orderDetails[orderId]) {
      try {
        const { data } = await api.orders.getById(orderId);
        setOrderDetails((prev) => ({
          ...prev,
          [orderId]: data?.order || null,
        }));
      } catch (err) {
        console.error("Error al obtener detalles:", err);
        alert("No se pudieron cargar los detalles del pedido");
      }
    }

    setExpandedOrder(orderId);
  };

  const handleOrderStatusChange = async (orderId, nextStatus) => {
    setUpdatingOrderId(orderId);
    const res = await setOrderStatus(orderId, nextStatus);
    setUpdatingOrderId(null);

    if (!res?.success) {
      alert(res?.error || "No se pudo actualizar el estado del pedido");
      return;
    }

    alert("Estado del pedido actualizado");
  };

  const handlePaymentStatusChange = async (orderId, nextPaymentStatus) => {
    setUpdatingPaymentId(orderId);
    const res = await setPaymentStatus(orderId, nextPaymentStatus);
    setUpdatingPaymentId(null);

    if (!res?.success) {
      alert(res?.error || "No se pudo actualizar el estado del pago");
      return;
    }

    alert("Estado del pago actualizado");
  };

  return (
    <section className="profile-orders-admin">
      <div className="orders-header">
        <h2>Pedidos de usuarios</h2>
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <input
          type="text"
          placeholder="Buscar por ID, nombre o email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="processing">Procesando</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="all">Todos los pagos</option>
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobado</option>
          <option value="rejected">Rechazado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div style={{ marginBottom: 12, fontSize: 14 }}>
        Total: <strong>{stats?.total ?? 0}</strong> | Pendientes:{" "}
        <strong>{stats?.pending ?? 0}</strong> | Procesando:{" "}
        <strong>{stats?.processing ?? 0}</strong> | Entregados:{" "}
        <strong>{stats?.delivered ?? 0}</strong> | Cancelados:{" "}
        <strong>{stats?.cancelled ?? 0}</strong>
      </div>

      {isLoading && <p>Cargando pedidos…</p>}
      {error && <div className="orders-error">{error}</div>}

      {!isLoading &&
        !error &&
        (orders.length === 0 ? (
          <p>No hay pedidos todavía.</p>
        ) : (
          <ul className="orders-list">
            {orders.map((o) => (
              <li key={o.id} className="disponsal-item">
                <div className="disponsal-summary">
                  <div>
                    <strong>Pedido #{o.id}</strong>
                  </div>
                  <div>
                    <strong>Usuario:</strong> {o.userName} ({o.userEmail})
                  </div>
                  <div>
                    Fecha:{" "}
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleString("es-AR")
                      : "-"}
                  </div>
                  <div>
                    Estado: {o.status}{" "}
                    {o.paymentStatus ? `(pago: ${o.paymentStatus})` : ""}
                  </div>
                  <div>
                    Total: ${Number(o.total || 0).toLocaleString("es-AR")}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 8,
                    }}
                  >
                    <select
                      value={o.status || "pending"}
                      disabled={updatingOrderId === o.id}
                      onChange={(e) =>
                        handleOrderStatusChange(o.id, e.target.value)
                      }
                    >
                      <option value="pending">Pendiente</option>
                      <option value="processing">Procesando</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>

                    <select
                      value={o.paymentStatus || "pending"}
                      disabled={updatingPaymentId === o.id}
                      onChange={(e) =>
                        handlePaymentStatusChange(o.id, e.target.value)
                      }
                    >
                      <option value="pending">Pago pendiente</option>
                      <option value="approved">Pago aprobado</option>
                      <option value="rejected">Pago rechazado</option>
                      <option value="cancelled">Pago cancelado</option>
                    </select>
                  </div>

                  <div
                    className="order-items-toggle"
                    onClick={() => toggleOrderDetails(o.id)}
                  >
                    Items: {o.itemsCount || 0}
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
                          <p>{orderDetails[o.id].shipping_address}</p>
                          <p>{orderDetails[o.id].shipping_city}</p>
                          <p>{orderDetails[o.id].shipping_state}</p>
                          <p>{orderDetails[o.id].shipping_zip}</p>
                          <p>Tel: {orderDetails[o.id].shipping_phone}</p>
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
}
