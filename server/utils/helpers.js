/**
 * Genera un slug URL-friendly desde un texto
 * @param {string} text - Texto a convertir
 * @returns {string} Slug generado
 */
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-z0-9]+/g, "-") // Reemplazar espacios y caracteres especiales con guiones
    .replace(/^-+|-+$/g, ""); // Eliminar guiones al inicio y final
};

/**
 * Valida que un string no esté vacío después de hacer trim
 * @param {string} value - Valor a validar
 * @returns {boolean}
 */
export const isNotEmpty = (value) => {
  return value && typeof value === "string" && value.trim() !== "";
};

/**
 * Formatea un precio a 2 decimales
 * @param {number} price - Precio a formatear
 * @returns {number}
 */
export const formatPrice = (price) => {
  return Math.round(price * 100) / 100;
};

/**
 * Genera un nombre de archivo único
 * @param {string} originalName - Nombre original del archivo
 * @returns {string}
 */
export const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${random}.${extension}`;
};
