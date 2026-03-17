import { useState, useMemo, useCallback, useEffect } from "react";
import { useAdminStore } from "../stores/adminStore";
import {
  normalizeProducts,
  normalizeCategories,
  validateProductData,
  prepareProductPayload,
} from "../services/admin.service";

const INITIAL_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
};

export const useAdminProducts = () => {
  const {
    products,
    categories,
    isLoading,
    error,
    clearError,
    fetchProducts,
    fetchCategories,
    createProduct,
    insertProduct,
    updateProduct,
    editProduct,
    deleteProduct,
    removeProduct,
  } = useAdminStore();

  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);

  const normalizedProducts = useMemo(
    () => normalizeProducts(products),
    [products],
  );
  const normalizedCategories = useMemo(
    () => normalizeCategories(categories),
    [categories],
  );

  useEffect(() => {
    fetchProducts?.();
    fetchCategories?.();
  }, [fetchProducts, fetchCategories]);

  const setField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setFormFromProduct = useCallback((product) => {
    if (!product) return;
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      category_id: String(product.categoryId ?? product.category_id ?? ""),
    });
    setImageFile(null);
    setFormErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setImageFile(null);
    setFormErrors({});
  }, []);

  const validateForm = useCallback(() => {
    const result = validateProductData(form);
    setFormErrors(result.errors || {});
    return result.isValid;
  }, [form]);

  const create = useCallback(async () => {
    if (!validateForm()) return { success: false, validation: true };
    const payload = prepareProductPayload(form, imageFile);
    const action = createProduct || insertProduct;
    if (typeof action !== "function") {
      return { success: false, error: "Acción createProduct no disponible" };
    }
    return await action(payload);
  }, [form, imageFile, validateForm, createProduct, insertProduct]);

  const update = useCallback(
    async (productId) => {
      if (!productId) return { success: false, error: "productId requerido" };
      if (!validateForm()) return { success: false, validation: true };

      const payload = prepareProductPayload(form, imageFile);
      const action = updateProduct || editProduct;
      if (typeof action !== "function") {
        return { success: false, error: "Acción updateProduct no disponible" };
      }
      return await action(productId, payload);
    },
    [form, imageFile, validateForm, updateProduct, editProduct],
  );

  const remove = useCallback(
    async (productId) => {
      if (!productId) return { success: false, error: "productId requerido" };
      const action = deleteProduct || removeProduct;
      if (typeof action !== "function") {
        return { success: false, error: "Acción deleteProduct no disponible" };
      }
      return await action(productId);
    },
    [deleteProduct, removeProduct],
  );

  return {
    products: normalizedProducts,
    categories: normalizedCategories,
    isLoading,
    error,
    form,
    formErrors,
    imageFile,
    setField,
    setImageFile,
    setFormFromProduct,
    resetForm,
    validateForm,
    createProduct: create,
    updateProductById: update,
    deleteProductById: remove,
    refreshProducts: fetchProducts,
    refreshCategories: fetchCategories,
    clearError,
  };
};
