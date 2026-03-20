const trimTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");
const trimLeadingSlash = (value = "") => String(value).replace(/^\/+/, "");

export const getBackendOrigin = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL || "";
  return trimTrailingSlash(envUrl);
};

export const isAbsoluteUrl = (value = "") =>
  /^https?:\/\//i.test(value) || String(value).startsWith("data:");

export const joinUrl = (base = "", path = "") => {
  if (!base) return path || "";
  if (!path) return base;
  return `${trimTrailingSlash(base)}/${trimLeadingSlash(path)}`;
};

export const resolveUrl = (value = "", base = getBackendOrigin()) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (isAbsoluteUrl(raw)) return raw;
  if (!base) return raw;
  return joinUrl(base, raw);
};

export const pickImageValue = (input) => {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (typeof input === "object") {
    return input.url || input.image_url || input.imageUrl || input.src || "";
  }
  return "";
};

export const resolveImageUrl = (input, fallback = "") => {
  const raw = pickImageValue(input);
  const resolved = resolveUrl(raw);
  return resolved || fallback;
};

/*
 * Utilidades para manipulación de URLs
 * - getBackendOrigin: Obtiene la URL base del backend desde las variables de entorno, asegurándose de no tener una barra al final.
 * - isAbsoluteUrl: Verifica si una URL es absoluta (comienza con http://, https:// o data:).
 * - joinUrl: Une una base y un path, asegurándose de manejar las barras correctamente.
 * - resolveUrl: Resuelve una URL relativa usando la URL base del backend, o devuelve la URL absoluta si ya lo es.
 * - pickImageValue: Extrae la URL de una imagen de diferentes formatos de input (string, objeto con diferentes posibles claves).
 * - resolveImageUrl: Combina pickImageValue y resolveUrl para obtener la URL completa de una imagen, con un fallback opcional.
 */
