import { useState, useMemo, useCallback, useEffect } from "react";
import { useProfileStore } from "../stores/profileStore";
import {
  normalizeProfile,
  validateProfileData,
  prepareProfileData,
  sanitizeInput,
} from "../services/profile.service";

const INITIAL_FORM = {
  name: "",
  email: "",
  defaultCountry: "Argentina",
  defaultAddress: "",
  defaultAddress2: "",
  defaultCity: "",
  defaultState: "",
  defaultZip: "",
  defaultPhone: "",
};

export const useProfileForm = () => {
  const { profile, isLoading, error, updateProfile, clearError } =
    useProfileStore();

  const normalizedProfile = useMemo(() => normalizeProfile(profile), [profile]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!normalizedProfile) return;
    setForm({
      name: normalizedProfile.name || "",
      email: normalizedProfile.email || "",
      defaultCountry: normalizedProfile.defaultCountry || "Argentina",
      defaultAddress: normalizedProfile.defaultAddress || "",
      defaultAddress2: normalizedProfile.defaultAddress2 || "",
      defaultCity: normalizedProfile.defaultCity || "",
      defaultState: normalizedProfile.defaultState || "",
      defaultZip: normalizedProfile.defaultZip || "",
      defaultPhone: normalizedProfile.defaultPhone || "",
    });
  }, [normalizedProfile]);

  const updateField = useCallback((field, value) => {
    const safeValue = typeof value === "string" ? sanitizeInput(value) : value;
    setForm((prev) => ({ ...prev, [field]: safeValue }));

    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validateForm = useCallback(() => {
    const result = validateProfileData({
      name: form.name,
      email: form.email,
    });

    const addressErrors = {};
    if (!form.defaultCountry?.trim())
      addressErrors.defaultCountry = "El país es requerido";
    if (!form.defaultAddress?.trim())
      addressErrors.defaultAddress = "La dirección es requerida";
    if (!form.defaultCity?.trim())
      addressErrors.defaultCity = "La ciudad es requerida";
    if (!form.defaultZip?.trim())
      addressErrors.defaultZip = "El código postal es requerido";

    const errors = { ...result.errors, ...addressErrors };
    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  }, [form]);

  const submit = useCallback(async () => {
    if (!validateForm()) return { success: false, validation: true };

    const payload = prepareProfileData(form);
    return await updateProfile(payload);
  }, [form, validateForm, updateProfile]);

  const resetForm = useCallback(() => {
    if (!normalizedProfile) {
      setForm(INITIAL_FORM);
      setFormErrors({});
      return;
    }

    setForm({
      name: normalizedProfile.name || "",
      email: normalizedProfile.email || "",
      defaultCountry: normalizedProfile.defaultCountry || "Argentina",
      defaultAddress: normalizedProfile.defaultAddress || "",
      defaultAddress2: normalizedProfile.defaultAddress2 || "",
      defaultCity: normalizedProfile.defaultCity || "",
      defaultState: normalizedProfile.defaultState || "",
      defaultZip: normalizedProfile.defaultZip || "",
      defaultPhone: normalizedProfile.defaultPhone || "",
    });
    setFormErrors({});
  }, [normalizedProfile]);

  return {
    form,
    formErrors,
    isLoading,
    error,
    updateField,
    validateForm,
    submit,
    resetForm,
    clearError,
  };
};
