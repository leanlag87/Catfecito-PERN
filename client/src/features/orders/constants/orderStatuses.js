/**
 * Estados de orden con información visual
 * Usado para tracking y visualización del proceso
 */
export const ORDER_STATUSES = {
  processing: {
    label: "Procesando",
    color: "#ff9800",
    bgColor: "#ffe5b4",
    icon: "📦",
    description: "Orden en proceso",
    step: 1,
  },
  confirmed: {
    label: "Confirmada",
    color: "#2196f3",
    bgColor: "#d1ecf1",
    icon: "✓",
    description: "Orden confirmada",
    step: 2,
  },
  shipped: {
    label: "Enviada",
    color: "#00bcd4",
    bgColor: "#cff4fc",
    icon: "🚚",
    description: "Orden enviada",
    step: 3,
  },
  delivered: {
    label: "Entregada",
    color: "#4caf50",
    bgColor: "#d4edda",
    icon: "✅",
    description: "Orden entregada",
    step: 4,
  },
  cancelled: {
    label: "Cancelada",
    color: "#e74c3c",
    bgColor: "#f8d7da",
    icon: "🚫",
    description: "Orden cancelada",
    step: 0,
  },
};

/**
 * Obtiene info de estado de orden
 */
export const getOrderStatusInfo = (status) => {
  return (
    ORDER_STATUSES[status] || {
      label: status || "Desconocido",
      color: "#95a5a6",
      bgColor: "#e2e3e5",
      icon: "❓",
      description: "Estado desconocido",
      step: 0,
    }
  );
};

/**
 * Lista de estados válidos
 */
export const VALID_ORDER_STATUSES = Object.keys(ORDER_STATUSES);

/**
 * Verifica si un estado es válido
 */
export const isValidOrderStatus = (status) => {
  return VALID_ORDER_STATUSES.includes(status);
};

/**
 * Obtiene el siguiente estado en el proceso
 */
export const getNextOrderStatus = (currentStatus) => {
  const current = ORDER_STATUSES[currentStatus];
  if (
    !current ||
    currentStatus === "cancelled" ||
    currentStatus === "delivered"
  ) {
    return null;
  }

  const nextStep = current.step + 1;
  const nextStatus = Object.entries(ORDER_STATUSES).find(
    //Razón: Usar , (coma) en lugar de _ cuando no usas la variable.
    //Es la convención correcta en destructuring.
    ([, info]) => info.step === nextStep,
  );

  return nextStatus ? nextStatus[0] : null;
};

/**
 * Verifica si una orden puede avanzar al siguiente estado
 */
export const canProgressToNextStatus = (currentStatus) => {
  return getNextOrderStatus(currentStatus) !== null;
};
