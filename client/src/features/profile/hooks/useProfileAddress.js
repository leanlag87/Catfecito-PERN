import { useMemo, useState, useCallback } from "react";
import { useProfileStore } from "../stores/profileStore";
import {
  normalizeAddresses,
  getDefaultAddress,
  validateAddressData,
  prepareAddressData,
  formatFullAddress,
} from "../services/profile.service";

const EMPTY_ADDRESS = {
  country: "Argentina",
  address: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  isDefault: false,
};

export const useProfileAddress = () => {
  const {
    addresses,
    isLoading,
    error,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    clearError,
  } = useProfileStore();

  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [formErrors, setFormErrors] = useState({});

  const normalizedAddresses = useMemo(
    () => normalizeAddresses(addresses),
    [addresses],
  );

  const defaultAddress = useMemo(
    () => getDefaultAddress(normalizedAddresses),
    [normalizedAddresses],
  );

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setAddressToEdit = useCallback((address) => {
    if (!address) return;
    setForm({
      country: address.country || "Argentina",
      address: address.address || "",
      address2: address.address2 || "",
      city: address.city || "",
      state: address.state || "",
      zip: address.zip || "",
      phone: address.phone || "",
      isDefault: !!(address.isDefault || address.is_default),
    });
    setFormErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setForm(EMPTY_ADDRESS);
    setFormErrors({});
  }, []);

  const validateForm = useCallback(() => {
    const result = validateAddressData(form);
    setFormErrors(result.errors || {});
    return result.isValid;
  }, [form]);

  const create = useCallback(async () => {
    if (!validateForm()) return { success: false, validation: true };
    const payload = prepareAddressData(form);
    return await addAddress(payload);
  }, [form, validateForm, addAddress]);

  const update = useCallback(
    async (addressId) => {
      if (!addressId) return { success: false, error: "addressId requerido" };
      if (!validateForm()) return { success: false, validation: true };
      const payload = prepareAddressData(form);
      return await updateAddress(addressId, payload);
    },
    [form, validateForm, updateAddress],
  );

  const remove = useCallback(
    async (addressId) => {
      if (!addressId) return { success: false, error: "addressId requerido" };
      return await deleteAddress(addressId);
    },
    [deleteAddress],
  );

  return {
    // estado store
    addresses: normalizedAddresses,
    defaultAddress,
    isLoading,
    error,

    // estado formulario
    form,
    formErrors,
    formattedDefaultAddress: formatFullAddress(defaultAddress),

    // acciones store
    fetchAddresses,
    clearError,

    // acciones form
    updateField,
    setAddressToEdit,
    resetForm,
    validateForm,

    // CRUD
    createAddress: create,
    updateAddressById: update,
    deleteAddressById: remove,
  };
};
