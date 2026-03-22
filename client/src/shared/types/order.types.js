/**
 * @typedef {Object} OrderItem
 * @property {number|string} [id]
 * @property {number|string} [product_id]
 * @property {string} [product_name]
 * @property {number|string} [price]
 * @property {number|string} [quantity]
 * @property {number|string} [subtotal]
 * @property {string|{url?:string}} [image]
 * @property {string} [image_url]
 */

/**
 * @typedef {Object} Order
 * @property {number|string} id
 * @property {string} [userName]
 * @property {string} [userEmail]
 * @property {string} [status]
 * @property {string} [paymentStatus]
 * @property {number} total
 * @property {number} [itemsCount]
 * @property {OrderItem[]} [items]
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */

export {};

/**
 * Este archivo define los tipos relacionados con órdenes para mejorar la autocompletación y documentación en el código.
 * Los tipos incluyen la estructura de un ítem de orden y la estructura de una orden completa.
 * No contiene lógica de negocio ni funciones, solo definiciones de tipos para uso en el proyecto.
 */
