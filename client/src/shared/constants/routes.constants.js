export const ROUTES = Object.freeze({
  HOME: "/",
  SHOP: "/shop",
  CART: "/cart",
  LOGIN: "/login",
  REGISTER: "/register",

  PROFILE: "/profile",
  PROFILE_INFO: "/profile/info",
  PROFILE_ADDRESS: "/profile/address",
  PROFILE_ORDERS: "/profile/orders",
  PROFILE_SECURITY: "/profile/security",

  ADMIN: "/admin",
  ADMIN_INSERT: "/admin/insert",
  ADMIN_UPDATE: "/admin/update",
  ADMIN_DELETE: "/admin/delete",
  ADMIN_ORDERS: "/admin/orders",

  NOT_FOUND: "*",
});

export const ROUTE_QUERY_KEYS = Object.freeze({
  SECTION: "section",
  PAYMENT: "payment",
  ORDER_ID: "order_id",
});

/**
 * Diferencia entre estas rutas y las definidas en apiEndpoints.js:
 * - Las rutas en ROUTES son para la navegación del cliente (React Router), mientras que las de apiEndpoints.js son para las llamadas a la API.
 * - ROUTES define las URL que los usuarios ven y navegan, mientras que apiEndpoints.js define las URL que el frontend usa para comunicarse con el backend.
 * - ROUTES se utiliza para configurar las rutas de la aplicación React, mientras que apiEndpoints.js se utiliza para configurar las rutas de los endpoints de la API.
 *   Ambos son correctos y no se pisan: uno maneja páginas, el otro maneja API.
 */
