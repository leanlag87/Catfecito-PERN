/**
 * Estados de pago con información visual
 * Usado para mostrar badges, colores y mensajes
 */
export const PAYMENT_STATUSES = {
  pending: {
    label: "Pendiente",
    color: "#f39c12",
    bgColor: "#fff3cd",
    icon: "⏳",
    description: "Esperando confirmación de pago",
  },
  approved: {
    label: "Pagado",
    color: "#4caf50",
    bgColor: "#d4edda",
    icon: "✅",
    description: "Pago confirmado",
  },
  authorized: {
    label: "Autorizado",
    color: "#2196f3",
    bgColor: "#d1ecf1",
    icon: "🔐",
    description: "Pago autorizado",
  },
  in_process: {
    label: "Procesando",
    color: "#ff9800",
    bgColor: "#ffe5b4",
    icon: "🔄",
    description: "Pago en proceso",
  },
  rejected: {
    label: "Rechazado",
    color: "#e74c3c",
    bgColor: "#f8d7da",
    icon: "❌",
    description: "Pago rechazado",
  },
  cancelled: {
    label: "Cancelado",
    color: "#95a5a6",
    bgColor: "#e2e3e5",
    icon: "🚫",
    description: "Pago cancelado",
  },
  refunded: {
    label: "Reembolsado",
    color: "#9c27b0",
    bgColor: "#f3e5f5",
    icon: "💸",
    description: "Pago reembolsado",
  },
};

//Obtiene info de estado de pago
export const getPaymentStatusInfo = (status) => {
  return (
    PAYMENT_STATUSES[status] || {
      label: status || "Desconocido",
      color: "#95a5a6",
      bgColor: "#e2e3e5",
      icon: "❓",
      description: "Estado desconocido",
    }
  );
};

//Lista de estados válidos
export const VALID_PAYMENT_STATUSES = Object.keys(PAYMENT_STATUSES);

//Verifica si un estado es válido
export const isValidPaymentStatus = (status) => {
  return VALID_PAYMENT_STATUSES.includes(status);
};
