export const API_ENDPOINTS = {
  // 🔐 AUTENTICACIÓN
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    VERIFY: "/api/auth/verify",
    REFRESH: "/api/auth/refresh",
  },

  // 👤 USUARIOS
  USER: {
    PROFILE: "/api/users/profile",
    UPDATE_PROFILE: "/api/users/profile",
    CHANGE_PASSWORD: "/api/users/password",
    ADDRESSES: "/api/users/addresses",
    DELETE_ACCOUNT: "/api/users/profile",
  },

  // 📦 PRODUCTOS
  PRODUCTS: {
    GET_ALL: "/api/products",
    GET_BY_ID: (id) => `/api/products/${id}`,
    GET_BY_CATEGORY: (categoryId) => `/api/products/category/${categoryId}`,
    SEARCH: "/api/products/search",

    // Admin
    CREATE: "/api/admin/products",
    UPDATE: (id) => `/api/admin/products/${id}`,
    DELETE: (id) => `/api/admin/products/${id}`,
    UPDATE_STOCK: (id) => `/api/admin/products/${id}/stock`,
  },

  // 🗂️ CATEGORÍAS
  CATEGORIES: {
    GET_ALL: "/api/categories",
    GET_BY_ID: (id) => `/api/categories/${id}`,

    // Admin
    CREATE: "/api/admin/categories",
    UPDATE: (id) => `/api/admin/categories/${id}`,
    DELETE: (id) => `/api/admin/categories/${id}`,
  },

  // 🛒 CARRITO
  CART: {
    GET: "/api/cart",
    ADD_ITEM: "/api/cart/items",
    UPDATE_ITEM: (productId) => `/api/cart/items/${productId}`,
    REMOVE_ITEM: (productId) => `/api/cart/items/${productId}`,
    CLEAR: "/api/cart",
  },

  // 📋 ÓRDENES
  ORDERS: {
    GET_USER_ORDERS: "/api/orders",
    GET_ORDER_BY_ID: (id) => `/api/orders/${id}`,
    CREATE: "/api/orders",
    CANCEL: (id) => `/api/orders/${id}/cancel`,

    // Admin
    GET_ALL: "/api/admin/orders",
    UPDATE_STATUS: (id) => `/api/admin/orders/${id}/status`,
  },

  // 💳 PAGOS (MercadoPago)
  PAYMENTS: {
    CREATE_PREFERENCE: "/api/payments/create-preference",
    WEBHOOK: "/api/payments/webhook",
    GET_PUBLIC_KEY: "/api/payments/public-key",
    VERIFY_PAYMENT: (paymentId) => `/api/payments/verify/${paymentId}`,
  },

  // 👑 ADMIN
  ADMIN: {
    // Dashboard/Stats
    STATS: "/api/admin/stats",

    // Gestión de usuarios
    USERS: {
      GET_ALL: "/api/admin/users",
      GET_BY_ID: (id) => `/api/admin/users/${id}`,
      UPDATE_ROLE: (id) => `/api/admin/users/${id}/role`,
      DELETE: (id) => `/api/admin/users/${id}`,
    },
  },
};

// 🛠️ HELPERS (Opcional)
/**
 * Construye URL completa con query params
 * @param {string} endpoint - Endpoint base
 * @param {Object} params - Query parameters
 * @returns {string} URL con query params
 *
 * @example
 * buildUrl('/api/products', { category: 'cafes', limit: 10 })
 * // → '/api/products?category=cafes&limit=10'
 */
export const buildUrl = (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

/**
 * Valida si un endpoint es válido
 * @param {string} endpoint
 * @returns {boolean}
 */
export const isValidEndpoint = (endpoint) => {
  return (
    endpoint && typeof endpoint === "string" && endpoint.startsWith("/api/")
  );
};
