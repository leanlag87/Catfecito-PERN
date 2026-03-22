/**
 * @typedef {Object} AuthUser
 * @property {number|string} id
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [role]
 */

/**
 * @typedef {Object} AuthState
 * @property {AuthUser|null} user
 * @property {string|null} token
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {string|null} error
 */

export {};

/**
 * Este archivo define los tipos relacionados con la autenticación para mejorar la autocompletación y documentación en el código.
 * Los tipos incluyen la estructura de un usuario autenticado y el estado de autenticación.
 * No contiene lógica de negocio ni funciones, solo definiciones de tipos para uso en el proyecto.
 */
