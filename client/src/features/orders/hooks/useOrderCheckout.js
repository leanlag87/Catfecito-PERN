import { useState, useCallback } from "react";
import { useOrdersStore } from "../stores/ordersStore";
import { useCartStore } from "../../cart/stores/cartStore";
import { useAuthStore } from "../../auth/stores/authStore";
import {
  validateShippingAddress,
  prepareCheckoutData,
} from "../services/orders.service";
import { validateCartForCheckout } from "../../cart/services/cart.service";

/**
 * Hook para manejar el proceso de checkout
 * Gestiona validación, creación de orden y pago
 *
 * @returns {Object} Estado y métodos del checkout
 *
 * @example
 * const {
 *   shippingData,
 *   errors,
 *   isProcessing,
 *   updateShippingData,
 *   validateForm,
 *   processCheckout
 * } = useOrderCheckout();
 */
export const useOrderCheckout = () => {
  const { isAuthenticated } = useAuthStore();
  const { items: cartItems, clearCart } = useCartStore();
  const { createOrder, createPaymentPreference, isLoading } = useOrdersStore();

  // Estado del formulario de envío
  const [shippingData, setShippingData] = useState({
    firstName: "",
    lastName: "",
    country: "Argentina",
    address: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Actualizar un campo del formulario
  const updateShippingData = useCallback(
    (field, value) => {
      setShippingData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Limpiar error del campo al escribir
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors],
  );

  // Actualizar múltiples campos
  const updateMultipleFields = useCallback((data) => {
    setShippingData((prev) => ({
      ...prev,
      ...data,
    }));
  }, []);

  // Validar formulario
  const validateForm = useCallback(() => {
    // Validar autenticación
    if (!isAuthenticated) {
      setCheckoutError("Debes iniciar sesión para continuar");
      return false;
    }

    // Validar carrito
    const cartValidation = validateCartForCheckout(cartItems);
    if (!cartValidation.isValid) {
      setCheckoutError(cartValidation.errors[0]);
      return false;
    }

    // Preparar datos para validación
    const dataToValidate = {
      shipping_first_name: shippingData.firstName,
      shipping_last_name: shippingData.lastName,
      shipping_country: shippingData.country,
      shipping_address: shippingData.address,
      shipping_address2: shippingData.address2,
      shipping_city: shippingData.city,
      shipping_state: shippingData.state,
      shipping_zip: shippingData.zip,
      shipping_phone: shippingData.phone,
    };

    // Validar dirección
    const validation = validateShippingAddress(dataToValidate);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setCheckoutError("Por favor completa todos los campos requeridos");
      return false;
    }

    setErrors({});
    setCheckoutError("");
    return true;
  }, [isAuthenticated, cartItems, shippingData]);

  // Procesar checkout completo
  const processCheckout = useCallback(async () => {
    // Validar formulario
    if (!validateForm()) {
      return { success: false, error: checkoutError || "Validación fallida" };
    }

    setIsProcessing(true);
    setCheckoutError("");

    try {
      // Preparar datos de orden
      const orderData = prepareCheckoutData(shippingData);

      // Crear orden
      const order = await createOrder(orderData);

      if (!order || !order.id) {
        throw new Error("No se pudo crear la orden");
      }

      // Crear preferencia de pago
      const preference = await createPaymentPreference(order.id);

      if (!preference || !preference.init_point) {
        throw new Error("No se pudo generar el link de pago");
      }

      // Limpiar carrito después de crear orden
      await clearCart();

      // Redirigir a Mercado Pago
      window.location.href = preference.init_point;

      return {
        success: true,
        order,
        preference,
      };
    } catch (error) {
      console.error("Error en checkout:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error al procesar la orden";
      setCheckoutError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  }, [
    validateForm,
    checkoutError,
    shippingData,
    createOrder,
    createPaymentPreference,
    clearCart,
  ]);

  // Limpiar errores
  const clearErrors = useCallback(() => {
    setErrors({});
    setCheckoutError("");
  }, []);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setShippingData({
      firstName: "",
      lastName: "",
      country: "Argentina",
      address: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
    });
    setErrors({});
    setCheckoutError("");
  }, []);

  return {
    // Estado
    shippingData,
    errors,
    checkoutError,
    isProcessing: isProcessing || isLoading,
    isAuthenticated,

    // Validación
    hasErrors: Object.keys(errors).length > 0 || !!checkoutError,
    isValid: Object.keys(errors).length === 0 && !checkoutError,

    // Acciones
    updateShippingData,
    updateMultipleFields,
    validateForm,
    processCheckout,
    clearErrors,
    resetForm,
  };
};
