import { useMemo } from "react";
import { useAdminStore } from "../stores/adminStore";
import {
  normalizeProducts,
  normalizeCategories,
  normalizeOrdersAdmin,
} from "../services/admin.service";

export const useAdmin = () => {
  const {
    products,
    categories,
    allOrders,
    users,
    stats,
    isLoading,
    error,
    checkAdminAccess,
    clearError,
    reset,
  } = useAdminStore();

  return {
    products: useMemo(() => normalizeProducts(products), [products]),
    categories: useMemo(() => normalizeCategories(categories), [categories]),
    allOrders: useMemo(() => normalizeOrdersAdmin(allOrders), [allOrders]),
    users,
    stats,
    isLoading,
    error,
    checkAdminAccess,
    clearError,
    reset,
  };
};
