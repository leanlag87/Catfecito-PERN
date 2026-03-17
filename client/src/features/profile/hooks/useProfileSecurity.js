import { useState, useMemo, useCallback } from "react";
import { useProfileStore } from "../stores/profileStore";
import {
  validatePassword,
  validatePasswordChange,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
} from "../services/profile.service";

const INITIAL_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const useProfileSecurity = () => {
  const {
    isLoading,
    error,
    clearError,
    changePassword, // si existe en store
    updatePassword, // fallback si el store usa otro nombre
  } = useProfileStore();

  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(form.newPassword || ""),
    [form.newPassword],
  );

  const strengthInfo = useMemo(
    () => getPasswordStrengthLabel(passwordStrength),
    [passwordStrength],
  );

  const passwordValidation = useMemo(
    () => validatePassword(form.newPassword || ""),
    [form.newPassword],
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

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setFormErrors({});
  }, []);

  const validateForm = useCallback(() => {
    const result = validatePasswordChange(
      form.currentPassword,
      form.newPassword,
      form.confirmPassword,
    );
    setFormErrors(result.errors || {});
    return result.isValid;
  }, [form]);

  const submitPasswordChange = useCallback(async () => {
    if (!validateForm()) return { success: false, validation: true };

    const action = changePassword || updatePassword;
    if (typeof action !== "function") {
      return {
        success: false,
        error: "No existe acción para cambiar contraseña en profileStore",
      };
    }

    return await action({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    });
  }, [form, validateForm, changePassword, updatePassword]);

  return {
    // estado
    form,
    formErrors,
    isLoading,
    error,

    // fuerza de contraseña
    passwordStrength,
    strengthInfo,
    passwordValidation,

    // acciones
    updateField,
    validateForm,
    submitPasswordChange,
    resetForm,
    clearError,
  };
};
