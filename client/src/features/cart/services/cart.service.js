/**
 * Cart Service - Funciones helper para el carrito
 *
 * Responsabilidades:
 * - Formatear datos de items del carrito
 * - Calcular totales y descuentos
 * - Validar stock
 * - Manejar imágenes de productos
 * - Calcular envío gratis
 */

//Normaliza un item del carrito del backend
export const normalizeCartItem = (item) => {
  if (!item) return null;

  return {
    id: item.product_id || item.id,
    cartItemId: item.id || item.cart_item_id,
    name: item.product_name || item.name || "",
    price: parseFloat(item.product_price || item.price) || 0,
    image:
      item.product_image ||
      item.image ||
      item.image_url ||
      "/placeholder-coffee.jpg",
    stock:
      typeof item.product_stock === "number" ? item.product_stock : item.stock,
    quantity: parseInt(item.quantity) || 1,
  };
};

//Normaliza array de items del carrito
export const normalizeCartItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeCartItem).filter(Boolean);
};

//Formatea imagen de item del carrito
export const formatCartItemImage = (item, backendUrl = "") => {
  if (!item) return "/placeholder-coffee.jpg";

  let imageValue = item.image || item.image_url || "";

  // Si es objeto con propiedad url
  if (
    imageValue &&
    typeof imageValue === "object" &&
    typeof imageValue.url === "string"
  ) {
    imageValue = imageValue.url;
  }

  if (typeof imageValue !== "string") return "/placeholder-coffee.jpg";

  const src = imageValue.trim();
  if (!src) return "/placeholder-coffee.jpg";

  // URLs absolutas y data URLs
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:")
  ) {
    return src;
  }

  // URL relativa
  if (!backendUrl) return src;

  const cleanBackendUrl = backendUrl.replace(/\/$/, "");
  return `${cleanBackendUrl}${src.startsWith("/") ? "" : "/"}${src}`;
};

//Calcula el subtotal del carrito
export const calculateSubtotal = (items) => {
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);
};

//Calcula el total de items en el carrito
export const calculateItemCount = (items) => {
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    const quantity = parseInt(item.quantity) || 0;
    return sum + quantity;
  }, 0);
};

//Calcula información de envío gratis
export const calculateFreeShipping = (subtotal, threshold = 36355) => {
  const isEligible = subtotal >= threshold;
  const amountNeeded = Math.max(0, threshold - subtotal);
  const progress = Math.min((subtotal / threshold) * 100, 100);

  return {
    isEligible,
    amountNeeded,
    progress,
    threshold,
  };
};

//Formatea monto para envío gratis
export const formatShippingMessage = (subtotal, threshold = 36355) => {
  const shipping = calculateFreeShipping(subtotal, threshold);

  if (shipping.isEligible) {
    return {
      message: "¡El envío es gratis! 🎁",
      type: "success",
    };
  }

  return {
    message: `Suma $${shipping.amountNeeded.toLocaleString("es-AR")} más para envío gratis 🎁`,
    type: "info",
  };
};

//Valida si se puede agregar más cantidad de un item
export const canAddMoreQuantity = (item, quantityToAdd = 1) => {
  if (!item) return false;

  const currentQuantity = parseInt(item.quantity) || 0;
  const stock = typeof item.stock === "number" ? item.stock : Infinity;
  const newQuantity = currentQuantity + quantityToAdd;

  return newQuantity <= stock;
};

//Valida cantidad máxima permitida
export const getMaxAllowedQuantity = (item) => {
  if (!item) return 0;

  const stock = typeof item.stock === "number" ? item.stock : Infinity;
  return stock;
};

//Valida si un item está disponible
export const isItemAvailable = (item) => {
  if (!item) return false;

  const stock = typeof item.stock === "number" ? item.stock : Infinity;
  return stock > 0;
};

//Calcula el total de un item (precio * cantidad)
export const calculateItemTotal = (item) => {
  if (!item) return 0;

  const price = parseFloat(item.price) || 0;
  const quantity = parseInt(item.quantity) || 0;

  return price * quantity;
};

//Formatea precio con locale
export const formatCartPrice = (price, locale = "es-AR") => {
  if (typeof price !== "number") {
    price = parseFloat(price) || 0;
  }

  return price.toLocaleString(locale);
};

//Valida el carrito antes de checkout
export const validateCartForCheckout = (items) => {
  const errors = [];

  if (!Array.isArray(items) || items.length === 0) {
    errors.push("El carrito está vacío");
    return { isValid: false, errors };
  }

  // Validar cada item
  items.forEach((item) => {
    // Validar stock
    if (!isItemAvailable(item)) {
      errors.push(`${item.name} no está disponible`);
    }

    // Validar cantidad vs stock
    const stock = typeof item.stock === "number" ? item.stock : Infinity;
    if (item.quantity > stock) {
      errors.push(
        `${item.name}: cantidad excede el stock disponible (${stock})`,
      );
    }

    // Validar precio
    if (!item.price || item.price <= 0) {
      errors.push(`${item.name}: precio inválido`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

//Prepara datos del carrito para enviar al checkout
export const prepareCheckoutData = (items) => {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    productId: item.id,
    quantity: item.quantity,
    price: item.price,
  }));
};

//Detecta cambios en el stock de items del carrito
export const detectStockChanges = (localItems, serverItems) => {
  const changes = [];

  localItems.forEach((localItem) => {
    const serverItem = serverItems.find((s) => s.id === localItem.id);

    if (!serverItem) {
      changes.push({
        type: "removed",
        item: localItem,
        message: `${localItem.name} ya no está disponible`,
      });
      return;
    }

    // Verificar stock
    const localStock =
      typeof localItem.stock === "number" ? localItem.stock : Infinity;
    const serverStock =
      typeof serverItem.stock === "number" ? serverItem.stock : Infinity;

    if (serverStock < localStock) {
      changes.push({
        type: "stock_reduced",
        item: localItem,
        oldStock: localStock,
        newStock: serverStock,
        message: `${localItem.name}: stock reducido de ${localStock} a ${serverStock}`,
      });
    }

    // Verificar precio
    if (serverItem.price !== localItem.price) {
      changes.push({
        type: "price_changed",
        item: localItem,
        oldPrice: localItem.price,
        newPrice: serverItem.price,
        message: `${localItem.name}: precio cambió de $${localItem.price} a $${serverItem.price}`,
      });
    }
  });

  return changes;
};

//Agrupa items por categoría (para resumen)
export const groupItemsByCategory = (items) => {
  if (!Array.isArray(items)) return {};

  return items.reduce((acc, item) => {
    const category = item.category || "Sin categoría";

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(item);
    return acc;
  }, {});
};

//Obtiene resumen del carrito
export const getCartSummary = (items, freeShippingThreshold = 36355) => {
  const itemCount = calculateItemCount(items);
  const subtotal = calculateSubtotal(items);
  const shipping = calculateFreeShipping(subtotal, freeShippingThreshold);
  const validation = validateCartForCheckout(items);

  return {
    itemCount,
    subtotal,
    shipping,
    validation,
    isEmpty: itemCount === 0,
    isValid: validation.isValid,
  };
};
