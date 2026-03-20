export const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const formatCurrency = (
  value,
  { locale = "es-AR", currency = "ARS", maximumFractionDigits = 2 } = {},
) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(toNumber(value));
};

export const formatDate = (value, locale = "es-AR") => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(locale);
};

export const formatDateTime = (value, locale = "es-AR") => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(locale);
};

export const formatPhone = (phone = "") => {
  const clean = String(phone).replace(/[^\d+]/g, "");
  return clean || "-";
};

export const capitalize = (text = "") => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const truncate = (text = "", max = 80) => {
  if (typeof text !== "string") return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
};

export const normalizeText = (text = "") =>
  String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * Estas funciones de formato sirven para estandarizar la presentación de datos en la interfaz de usuario.
 * - toNumber: Convierte un valor a número, con un fallback seguro.
 * - formatCurrency: Formatea un número como moneda según la configuración regional.
 * - formatDate: Formatea una fecha a una cadena legible según la configuración regional.
 * - formatDateTime: Formatea una fecha y hora a una cadena legible según la configuración regional.
 * - formatPhone: Formatea un número de teléfono para su visualización.
 * - capitalize: Convierte la primera letra de un texto a mayúscula.
 * - truncate: Trunca un texto a una longitud máxima, agregando puntos suspensivos si es necesario.
 * - normalizeText: Normaliza un texto eliminando acentos y convirtiéndolo a minúsculas.
 * Estas funciones ayudan a mantener la consistencia en la presentación de datos y facilitan el mantenimiento del código.
 */
