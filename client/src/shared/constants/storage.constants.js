export const STORAGE_KEYS = Object.freeze({
  AUTH_TOKEN: "catfecito_auth_token",
  REFRESH_TOKEN: "catfecito_refresh_token",
  USER: "catfecito_user",

  CART: "catfecito_cart",
  CART_SYNC_AT: "catfecito_cart_sync_at",

  PWA_INSTALL_DISMISSED: "catfecito_pwa_install_dismissed",
  PWA_INSTALL_LAST_PROMPT_AT: "catfecito_pwa_install_last_prompt_at",

  THEME: "catfecito_theme",
  LOCALE: "catfecito_locale",
});

export const STORAGE_AREAS = Object.freeze({
  LOCAL: "localStorage",
  SESSION: "sessionStorage",
});

/**
 * Estas constantes sirven para centralizar las claves de almacenamiento y evitar errores de tipeo.
 * También permiten cambiar fácilmente la estrategia de almacenamiento (localStorage, sessionStorage, etc.) en el futuro.
 */
