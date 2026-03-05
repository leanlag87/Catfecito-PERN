/**
 * Orders Service - Funciones helper para órdenes
 *
 * Responsabilidades:
 * - Normalizar datos de órdenes del backend
 * - Formatear fechas y direcciones
 * - Calcular totales
 * - Validar datos de shipping
 * - Preparar datos para checkout
 */

//Normaliza una orden del backend
export const normalizeOrder = (order) => {
  if (!order) return null;

  return {
    id: order.id || order.order_id,
    userId: order.user_id || order.userId,
    total: parseFloat(order.total) || 0,
    currency: order.currency || "ARS",
    paymentStatus: order.payment_status || "pending",
    orderStatus: order.order_status || order.status || "processing",
    paymentId: order.payment_id || null,
    preferenceId: order.preference_id || null,

    shippingFirstName: order.shipping_first_name || "",
    shippingLastName: order.shipping_last_name || "",
    shippingCountry: order.shipping_country || "Argentina",
    shippingAddress: order.shipping_address || "",
    shippingAddress2: order.shipping_address2 || "",
    shippingCity: order.shipping_city || "",
    shippingState: order.shipping_state || "",
    shippingZip: order.shipping_zip || "",
    shippingPhone: order.shipping_phone || "",

    items: Array.isArray(order.items) ? order.items : [],

    createdAt: order.created_at || order.createdAt || new Date().toISOString(),
    updatedAt: order.updated_at || order.updatedAt || null,
    paidAt: order.paid_at || order.paidAt || null,
  };
};

export const normalizeOrders = (orders) => {
  if (!Array.isArray(orders)) return [];
  return orders.map(normalizeOrder).filter(Boolean);
};

export const formatOrderDate = (date, format = "long") => {
  if (!date) return "-";

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "-";

  if (format === "short") {
    return dateObj.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (format === "medium") {
    return dateObj.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return dateObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const calculateOrderItemsTotal = (items) => {
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    const price = parseFloat(item.price || item.product_price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);
};

export const calculateOrderItemsCount = (items) => {
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    return sum + (parseInt(item.quantity) || 0);
  }, 0);
};

export const formatShippingAddress = (order) => {
  if (!order) return "";

  const parts = [
    order.shippingAddress || order.shipping_address,
    order.shippingAddress2 || order.shipping_address2,
    order.shippingCity || order.shipping_city,
    order.shippingState || order.shipping_state,
    order.shippingZip || order.shipping_zip,
    order.shippingCountry || order.shipping_country,
  ].filter(Boolean);

  return parts.join(", ");
};

export const formatShippingName = (order) => {
  if (!order) return "";

  const firstName = order.shippingFirstName || order.shipping_first_name || "";
  const lastName = order.shippingLastName || order.shipping_last_name || "";

  return `${firstName} ${lastName}`.trim();
};

export const validateShippingAddress = (shippingData) => {
  const errors = {};

  if (
    !shippingData.shipping_first_name ||
    shippingData.shipping_first_name.trim().length < 2
  ) {
    errors.firstName = "El nombre debe tener al menos 2 caracteres";
  }

  if (
    !shippingData.shipping_last_name ||
    shippingData.shipping_last_name.trim().length < 2
  ) {
    errors.lastName = "El apellido debe tener al menos 2 caracteres";
  }

  if (
    !shippingData.shipping_address ||
    shippingData.shipping_address.trim().length < 5
  ) {
    errors.address = "La dirección debe tener al menos 5 caracteres";
  }

  if (
    !shippingData.shipping_city ||
    shippingData.shipping_city.trim().length < 2
  ) {
    errors.city = "La ciudad es requerida";
  }

  if (
    !shippingData.shipping_zip ||
    shippingData.shipping_zip.trim().length < 4
  ) {
    errors.zip = "El código postal debe tener al menos 4 caracteres";
  }

  if (!shippingData.shipping_country) {
    errors.country = "El país es requerido";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const prepareCheckoutData = (shippingData) => {
  return {
    shipping_first_name: shippingData.firstName,
    shipping_last_name: shippingData.lastName,
    shipping_country: shippingData.country || "Argentina",
    shipping_address: shippingData.address,
    shipping_address2: shippingData.address2 || "",
    shipping_city: shippingData.city,
    shipping_state: shippingData.state || "",
    shipping_zip: shippingData.zip,
    shipping_phone: shippingData.phone || "",
  };
};

export const canCancelOrder = (order) => {
  if (!order) return false;

  const status = order.orderStatus || order.order_status;
  const paymentStatus = order.paymentStatus || order.payment_status;

  if (["cancelled", "delivered", "shipped"].includes(status)) {
    return false;
  }

  if (paymentStatus === "approved" && status === "confirmed") {
    return false;
  }

  return true;
};

export const canPayOrder = (order) => {
  if (!order) return false;

  const paymentStatus = order.paymentStatus || order.payment_status;
  const orderStatus = order.orderStatus || order.order_status;

  return paymentStatus === "pending" && orderStatus !== "cancelled";
};

export const groupOrdersByPaymentStatus = (orders) => {
  if (!Array.isArray(orders)) return {};

  return orders.reduce((acc, order) => {
    const status = order.paymentStatus || order.payment_status || "pending";

    if (!acc[status]) {
      acc[status] = [];
    }

    acc[status].push(order);
    return acc;
  }, {});
};

export const filterOrdersByDateRange = (orders, startDate, endDate) => {
  if (!Array.isArray(orders)) return [];

  return orders.filter((order) => {
    const orderDate = new Date(order.createdAt || order.created_at);
    const start = new Date(startDate);
    const end = new Date(endDate);

    return orderDate >= start && orderDate <= end;
  });
};

export const getRecentOrders = (orders, days = 30) => {
  if (!Array.isArray(orders)) return [];

  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - days);

  return orders.filter((order) => {
    const orderDate = new Date(order.createdAt || order.created_at);
    return orderDate >= limitDate;
  });
};

export const calculateOrdersStats = (orders) => {
  if (!Array.isArray(orders)) {
    return {
      total: 0,
      totalAmount: 0,
      pending: 0,
      approved: 0,
      cancelled: 0,
      averageAmount: 0,
    };
  }

  const stats = orders.reduce(
    (acc, order) => {
      const total = parseFloat(order.total) || 0;
      const status = order.paymentStatus || order.payment_status;

      acc.total++;
      acc.totalAmount += total;

      if (status === "pending") acc.pending++;
      if (status === "approved") acc.approved++;
      if (status === "cancelled") acc.cancelled++;

      return acc;
    },
    {
      total: 0,
      totalAmount: 0,
      pending: 0,
      approved: 0,
      cancelled: 0,
    },
  );

  stats.averageAmount = stats.total > 0 ? stats.totalAmount / stats.total : 0;

  return stats;
};

export const formatOrderTotal = (order, locale = "es-AR") => {
  if (!order) return "$0";

  const total = parseFloat(order.total) || 0;
  const currency = order.currency || "ARS";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(total);
};
