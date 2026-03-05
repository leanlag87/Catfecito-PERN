import { useMemo } from "react";
import { useCartStore } from "../stores/cartStore";
import {
  calculateSubtotal,
  calculateFreeShipping,
  formatShippingMessage,
} from "../services/cart.service";

/**
 * Hook para manejar la lógica de envío gratis
 * Calcula progreso, mensaje y estado
 *
 * @param {number} threshold - Monto mínimo para envío gratis (default: 36355)
 * @returns {Object} Estado del envío gratis
 *
 * @example
 * const {
 *   isEligible,
 *   amountNeeded,
 *   progress,
 *   message
 * } = useFreeShipping(36355);
 */
export const useFreeShipping = (threshold = 36355) => {
  const { items } = useCartStore();

  // Calcular subtotal
  const subtotal = useMemo(() => {
    return calculateSubtotal(items);
  }, [items]);

  // Calcular información de envío gratis
  const shipping = useMemo(() => {
    return calculateFreeShipping(subtotal, threshold);
  }, [subtotal, threshold]);

  // Obtener mensaje formateado
  const formattedMessage = useMemo(() => {
    return formatShippingMessage(subtotal, threshold);
  }, [subtotal, threshold]);

  // Calcular porcentaje para mostrar
  const progressPercentage = useMemo(() => {
    return `${Math.round(shipping.progress)}%`;
  }, [shipping.progress]);

  // Verificar si está cerca de lograr envío gratis (>80%)
  const isCloseToFree = useMemo(() => {
    return shipping.progress >= 80 && !shipping.isEligible;
  }, [shipping.progress, shipping.isEligible]);

  return {
    // Estados principales
    isEligible: shipping.isEligible,
    amountNeeded: shipping.amountNeeded,
    progress: shipping.progress,
    threshold: shipping.threshold,

    // Valores formateados
    message: formattedMessage.message,
    messageType: formattedMessage.type,
    progressPercentage,

    // Estados adicionales
    isCloseToFree,
    subtotal,
  };
};
