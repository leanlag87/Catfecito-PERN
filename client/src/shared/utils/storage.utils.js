import { STORAGE_AREAS } from "../constants";

const getStorage = (area = STORAGE_AREAS.LOCAL) => {
  if (typeof window === "undefined") return null;
  return area === STORAGE_AREAS.SESSION
    ? window.sessionStorage
    : window.localStorage;
};

export const getItem = (key, area = STORAGE_AREAS.LOCAL) => {
  try {
    const storage = getStorage(area);
    if (!storage || !key) return null;
    return storage.getItem(key);
  } catch {
    return null;
  }
};

export const setItem = (key, value, area = STORAGE_AREAS.LOCAL) => {
  try {
    const storage = getStorage(area);
    if (!storage || !key) return false;
    storage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
};

export const removeItem = (key, area = STORAGE_AREAS.LOCAL) => {
  try {
    const storage = getStorage(area);
    if (!storage || !key) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const clearStorage = (area = STORAGE_AREAS.LOCAL) => {
  try {
    const storage = getStorage(area);
    if (!storage) return false;
    storage.clear();
    return true;
  } catch {
    return false;
  }
};

export const getJSON = (key, fallback = null, area = STORAGE_AREAS.LOCAL) => {
  try {
    const raw = getItem(key, area);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const setJSON = (key, value, area = STORAGE_AREAS.LOCAL) => {
  try {
    return setItem(key, JSON.stringify(value), area);
  } catch {
    return false;
  }
};

export const hasItem = (key, area = STORAGE_AREAS.LOCAL) =>
  getItem(key, area) !== null;

/**
 * Estas funciones sirven como una capa de abstracción sobre localStorage/sessionStorage, proporcionando manejo de errores y soporte para JSON.
 * Esto ayuda a evitar errores comunes al interactuar con el almacenamiento web y facilita el manejo de datos complejos.
 * Además, centralizar esta lógica permite cambiar fácilmente la estrategia de almacenamiento en el futuro si es necesario.
 *
 */
