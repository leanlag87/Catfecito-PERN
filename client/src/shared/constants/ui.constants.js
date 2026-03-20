export const UI_BREAKPOINTS = Object.freeze({
  XS: 480,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
});

export const UI_Z_INDEX = Object.freeze({
  BASE: 1,
  HEADER: 100,
  NAVBAR: 200,
  DROPDOWN: 300,
  MODAL_BACKDROP: 900,
  MODAL: 1000,
  TOAST: 1100,
});

export const UI_DURATIONS_MS = Object.freeze({
  FAST: 150,
  NORMAL: 250,
  SLOW: 400,
  DEBOUNCE_SEARCH: 300,
});

export const UI_THEME = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
});

export const UI_STATUS = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
});

export const UI_TEXT_LIMITS = Object.freeze({
  PRODUCT_NAME_MAX: 120,
  PRODUCT_DESCRIPTION_MAX: 1000,
  SEARCH_MIN: 2,
});

/**
 * Estas constantes sirven para centralizar los límites de texto en la interfaz de usuario y evitar errores de tipeo.
 * También permiten cambiar fácilmente los límites en el futuro.
 */
