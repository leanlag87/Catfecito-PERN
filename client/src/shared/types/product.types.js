/**
 * @typedef {Object} Product
 * @property {number|string} id
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {number} stock
 * @property {number|string|null} category
 * @property {string} categoryName
 * @property {string} imageUrl
 * @property {boolean} isActive
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */

/**
 * @typedef {Object} ProductFilters
 * @property {string} [category]
 * @property {string} [search]
 * @property {number|null} [minPrice]
 * @property {number|null} [maxPrice]
 * @property {string} [sortBy]
 * @property {number} [page]
 * @property {number} [limit]
 * @property {boolean} [inStockOnly]
 */

/**
 * @typedef {Object} ProductValidationResult
 * @property {boolean} isValid
 * @property {Record<string,string>} errors
 */

export {};

/**
 * Este archivo define los tipos relacionados con productos para mejorar la autocompletación y documentación en el código.
 * Los tipos incluyen la estructura de un producto, los filtros que se pueden aplicar al listar productos, y el resultado de validar los datos de un producto.
 * No contiene lógica de negocio ni funciones, solo definiciones de tipos para uso en el proyecto.
 */
