/**
 * Products Service - Funciones helper para productos
 *
 * Responsabilidades:
 * - Normalizar datos de productos del backend
 * - Formatear precios
 * - Manejar imágenes
 * - Transformar filtros para queries
 * - Validar datos de productos
 */

//Normaliza datos de un producto del backend
export const normalizeProduct = (product) => {
  if (!product) return null;

  return {
    id: product.id || product.product_id,
    name: product.name || "",
    description: product.description || "",
    price: parseFloat(product.price) || 0,
    stock: parseInt(product.stock) || 0,
    category: product.category || product.category_id || null,
    categoryName: product.category_name || product.categoryName || "",
    imageUrl: product.image_url || product.imageUrl || product.image || "",
    isActive:
      product.is_active !== undefined
        ? product.is_active
        : product.isActive !== undefined
          ? product.isActive
          : true,
    createdAt: product.created_at || product.createdAt || null,
    updatedAt: product.updated_at || product.updatedAt || null,
  };
};

//Normaliza array de productos
export const normalizeProducts = (products) => {
  if (!Array.isArray(products)) return [];
  return products.map(normalizeProduct).filter(Boolean);
};

//Formatea precio a moneda local
export const formatPrice = (price, currency = "ARS") => {
  if (typeof price !== "number") {
    price = parseFloat(price) || 0;
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(price);
};

//Calcula descuento
export const calculateDiscount = (originalPrice, discountedPrice) => {
  if (!originalPrice || !discountedPrice) return 0;

  const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(discount);
};

//Verifica si un producto está disponible
export const isProductAvailable = (product) => {
  if (!product) return false;

  return product.isActive !== false && product.stock > 0;
};

//Obtiene estado de stock
export const getStockStatus = (stock) => {
  if (stock <= 0) {
    return { status: "out-of-stock", label: "Sin stock", color: "red" };
  }

  if (stock <= 5) {
    return {
      status: "low-stock",
      label: `Últimas ${stock} unidades`,
      color: "orange",
    };
  }

  return { status: "in-stock", label: "Disponible", color: "green" };
};

//Formatea imagen del producto
export const formatProductImage = (
  imageUrl,
  fallbackImage = "/placeholder-product.jpg",
) => {
  if (!imageUrl || imageUrl === "") {
    return fallbackImage;
  }

  // Si es URL completa, retornarla
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Si es path relativo, agregar base URL
  const baseUrl = import.meta.env.VITE_BACKEND_URL || "";
  return `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};

//Transforma filtros a query params para el backend
export const buildFilterQuery = (filters) => {
  const params = new URLSearchParams();

  // Categoría
  if (filters.category && filters.category !== "all") {
    params.append("category", filters.category);
  }

  // Búsqueda
  if (filters.search) {
    params.append("search", filters.search.trim());
  }

  // Rango de precios
  if (filters.minPrice !== undefined && filters.minPrice !== null) {
    params.append("min_price", filters.minPrice);
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
    params.append("max_price", filters.maxPrice);
  }

  // Ordenamiento
  if (filters.sortBy) {
    params.append("sort_by", filters.sortBy);
  }

  // Paginación
  if (filters.page) {
    params.append("page", filters.page);
  }

  if (filters.limit) {
    params.append("limit", filters.limit);
  }

  // Stock
  if (filters.inStockOnly) {
    params.append("in_stock", "true");
  }

  return params.toString();
};

//Parsea query params a objeto de filtros
export const parseFilterQuery = (queryString) => {
  const params = new URLSearchParams(queryString);

  return {
    category: params.get("category") || "all",
    search: params.get("search") || "",
    minPrice: params.get("min_price")
      ? parseFloat(params.get("min_price"))
      : null,
    maxPrice: params.get("max_price")
      ? parseFloat(params.get("max_price"))
      : null,
    sortBy: params.get("sort_by") || "name-asc",
    page: params.get("page") ? parseInt(params.get("page")) : 1,
    limit: params.get("limit") ? parseInt(params.get("limit")) : 12,
    inStockOnly: params.get("in_stock") === "true",
  };
};

//Opciones de ordenamiento
export const SORT_OPTIONS = [
  { value: "name-asc", label: "Nombre (A-Z)" },
  { value: "name-desc", label: "Nombre (Z-A)" },
  { value: "price-asc", label: "Precio (menor a mayor)" },
  { value: "price-desc", label: "Precio (mayor a menor)" },
  { value: "newest", label: "Más recientes" },
  { value: "oldest", label: "Más antiguos" },
];

//Ordena array de productos
export const sortProducts = (products, sortBy) => {
  if (!Array.isArray(products)) return [];

  const sorted = [...products];

  switch (sortBy) {
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));

    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);

    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);

    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );

    default:
      return sorted;
  }
};

//Filtra productos por criterios
export const filterProducts = (products, filters) => {
  if (!Array.isArray(products)) return [];

  let filtered = [...products];

  // Filtrar por categoría
  if (filters.category && filters.category !== "all") {
    filtered = filtered.filter(
      (p) =>
        p.category === filters.category || p.categoryName === filters.category,
    );
  }

  // Filtrar por búsqueda
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.categoryName?.toLowerCase().includes(searchLower),
    );
  }

  // Filtrar por precio
  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= filters.minPrice);
  }

  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= filters.maxPrice);
  }

  // Filtrar solo en stock
  if (filters.inStockOnly) {
    filtered = filtered.filter((p) => p.stock > 0 && p.isActive);
  }

  return filtered;
};

//Obtiene rango de precios de productos
export const getPriceRange = (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    return { min: 0, max: 0 };
  }

  const prices = products.map((p) => p.price).filter((p) => p > 0);

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

//Valida datos de producto (para admin)
export const validateProduct = (product) => {
  const errors = {};

  if (!product.name || product.name.trim().length < 3) {
    errors.name = "El nombre debe tener al menos 3 caracteres";
  }

  if (!product.description || product.description.trim().length < 10) {
    errors.description = "La descripción debe tener al menos 10 caracteres";
  }

  if (!product.price || product.price <= 0) {
    errors.price = "El precio debe ser mayor a 0";
  }

  if (product.stock === undefined || product.stock < 0) {
    errors.stock = "El stock debe ser mayor o igual a 0";
  }

  if (!product.category) {
    errors.category = "Debes seleccionar una categoría";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
