import apiClient from "../config/apiClient";
import { API_ENDPOINTS, buildUrl } from "../config/apiEndpoints";

/**
 * Servicio de API - Wrapper sobre axios
 * Usa endpoints centralizados y cliente configurado
 */
const api = {
  // 🔐 AUTENTICACIÓN
  auth: {
    register: (userData) =>
      apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),
    login: (credentials) =>
      apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
    verify: () => apiClient.get(API_ENDPOINTS.AUTH.VERIFY),
  },

  // 👤 USUARIOS
  users: {
    getProfile: () => apiClient.get(API_ENDPOINTS.USER.PROFILE),
    updateProfile: (data) =>
      apiClient.put(API_ENDPOINTS.USER.UPDATE_PROFILE, data),
    changePassword: (data) =>
      apiClient.put(API_ENDPOINTS.USER.CHANGE_PASSWORD, data),
    deleteAccount: () => apiClient.delete(API_ENDPOINTS.USER.DELETE_ACCOUNT),
  },

  // 📦 PRODUCTOS
  products: {
    getAll: (params) =>
      apiClient.get(buildUrl(API_ENDPOINTS.PRODUCTS.GET_ALL, params)),
    getById: (id) => apiClient.get(API_ENDPOINTS.PRODUCTS.GET_BY_ID(id)),
    getByCategory: (categoryId) =>
      apiClient.get(API_ENDPOINTS.PRODUCTS.GET_BY_CATEGORY(categoryId)),
    search: (query) =>
      apiClient.get(buildUrl(API_ENDPOINTS.PRODUCTS.SEARCH, { q: query })),

    // Admin
    create: (data) => apiClient.post(API_ENDPOINTS.PRODUCTS.CREATE, data),
    update: (id, data) =>
      apiClient.put(API_ENDPOINTS.PRODUCTS.UPDATE(id), data),
    delete: (id) => apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id)),
  },

  // 🏷️ CATEGORÍAS
  categories: {
    getAll: () => apiClient.get(API_ENDPOINTS.CATEGORIES.GET_ALL),
    getById: (id) => apiClient.get(API_ENDPOINTS.CATEGORIES.GET_BY_ID(id)),

    // Admin
    create: (data) => apiClient.post(API_ENDPOINTS.CATEGORIES.CREATE, data),
    update: (id, data) =>
      apiClient.put(API_ENDPOINTS.CATEGORIES.UPDATE(id), data),
    delete: (id) => apiClient.delete(API_ENDPOINTS.CATEGORIES.DELETE(id)),
  },

  // 🛒 CARRITO
  cart: {
    get: () => apiClient.get(API_ENDPOINTS.CART.GET),
    addItem: (productId, quantity) =>
      apiClient.post(API_ENDPOINTS.CART.ADD_ITEM, {
        product_id: productId,
        quantity,
      }),
    updateItem: (productId, quantity) =>
      apiClient.put(API_ENDPOINTS.CART.UPDATE_ITEM(productId), { quantity }),
    removeItem: (productId) =>
      apiClient.delete(API_ENDPOINTS.CART.REMOVE_ITEM(productId)),
    clear: () => apiClient.delete(API_ENDPOINTS.CART.CLEAR),
  },

  // 📋 ÓRDENES
  orders: {
    getUserOrders: () => apiClient.get(API_ENDPOINTS.ORDERS.GET_USER_ORDERS),
    getById: (id) => apiClient.get(API_ENDPOINTS.ORDERS.GET_ORDER_BY_ID(id)),
    create: (orderData) =>
      apiClient.post(API_ENDPOINTS.ORDERS.CREATE, orderData),
    cancel: (id) => apiClient.put(API_ENDPOINTS.ORDERS.CANCEL(id)),

    // Admin
    getAll: () => apiClient.get(API_ENDPOINTS.ORDERS.GET_ALL),
    updateStatus: (id, status) =>
      apiClient.put(API_ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status }),
  },

  // 💳 PAGOS
  payments: {
    createPreference: (orderData) =>
      apiClient.post(API_ENDPOINTS.PAYMENTS.CREATE_PREFERENCE, orderData),
    getPublicKey: () => apiClient.get(API_ENDPOINTS.PAYMENTS.GET_PUBLIC_KEY),
    verifyPayment: (paymentId) =>
      apiClient.get(API_ENDPOINTS.PAYMENTS.VERIFY_PAYMENT(paymentId)),
  },

  // 👑 ADMIN
  admin: {
    getStats: () => apiClient.get(API_ENDPOINTS.ADMIN.STATS),

    users: {
      getAll: () => apiClient.get(API_ENDPOINTS.ADMIN.USERS.GET_ALL),
      getById: (id) => apiClient.get(API_ENDPOINTS.ADMIN.USERS.GET_BY_ID(id)),
      updateRole: (id, role) =>
        apiClient.put(API_ENDPOINTS.ADMIN.USERS.UPDATE_ROLE(id), { role }),
      delete: (id) => apiClient.delete(API_ENDPOINTS.ADMIN.USERS.DELETE(id)),
    },
  },
};

export default api;
