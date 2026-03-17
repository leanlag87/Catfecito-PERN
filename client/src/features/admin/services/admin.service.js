export const normalizeProduct = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name || "",
    description: p.description || "",
    price: Number(p.price || 0),
    stock: Number(p.stock || 0),
    categoryId: p.category_id ?? p.categoryId ?? null,
    imageUrl: p.image_url || p.imageUrl || "",
    createdAt: p.created_at || p.createdAt || null,
    updatedAt: p.updated_at || p.updatedAt || null,
  };
};

export const normalizeProducts = (products) =>
  Array.isArray(products) ? products.map(normalizeProduct).filter(Boolean) : [];

export const normalizeCategory = (c) => {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name || "",
    createdAt: c.created_at || c.createdAt || null,
    updatedAt: c.updated_at || c.updatedAt || null,
  };
};

export const normalizeCategories = (categories) =>
  Array.isArray(categories)
    ? categories.map(normalizeCategory).filter(Boolean)
    : [];

export const normalizeOrderAdmin = (o) => {
  if (!o) return null;
  return {
    id: o.id,
    userName: o.user_name || o.userName || "",
    userEmail: o.user_email || o.userEmail || "",
    status: o.status || o.order_status || "processing",
    paymentStatus: o.payment_status || "pending",
    total: Number(o.total || 0),
    itemsCount: Number(o.items_count || 0),
    createdAt: o.created_at || o.createdAt || null,
    updatedAt: o.updated_at || o.updatedAt || null,
    items: Array.isArray(o.items) ? o.items : [],
    raw: o,
  };
};

export const normalizeOrdersAdmin = (orders) =>
  Array.isArray(orders) ? orders.map(normalizeOrderAdmin).filter(Boolean) : [];

export const validateProductData = (data) => {
  const errors = {};

  if (!data?.name?.trim()) errors.name = "El nombre es requerido";
  if (!data?.description?.trim())
    errors.description = "La descripción es requerida";
  if (data?.price === "" || Number(data?.price) < 0)
    errors.price = "Precio inválido";
  if (data?.stock !== "" && Number(data?.stock) < 0)
    errors.stock = "Stock inválido";
  if (!data?.category_id && !data?.categoryId)
    errors.category_id = "La categoría es requerida";

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateCategoryData = (data) => {
  const errors = {};
  if (!data?.name?.trim()) errors.name = "El nombre de categoría es requerido";
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const prepareProductPayload = (form, imageFile = null) => {
  const hasFile = !!imageFile;
  if (!hasFile) {
    return {
      name: form.name?.trim(),
      description: form.description?.trim(),
      price: form.price,
      stock: form.stock,
      category_id: form.category_id,
    };
  }

  const fd = new FormData();
  if (form.name !== "") fd.append("name", form.name.trim());
  if (form.description !== "")
    fd.append("description", form.description.trim());
  if (form.price !== "") fd.append("price", form.price);
  if (form.stock !== "") fd.append("stock", form.stock);
  if (form.category_id !== "") fd.append("category_id", form.category_id);
  fd.append("image", imageFile);
  return fd;
};

export const formatAdminCurrency = (
  value,
  locale = "es-AR",
  currency = "ARS",
) =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    Number(value || 0),
  );

export const formatAdminDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("es-AR");
};
