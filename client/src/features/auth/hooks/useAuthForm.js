import { useState } from "react";
import {
  validateLoginForm,
  validateRegisterForm,
} from "../validations/auth.validation";
import { formatLoginData, formatRegisterData } from "../services/auth.service";

/**
 * Hook para manejar formularios de autenticación (login/register)
 * Incluye validación, formateo y manejo de errores
 *
 * @param {string} formType - 'login' o 'register'
 * @returns {Object} Métodos y estado del formulario
 *
 * @example
 * function LoginForm() {
 *   const { values, errors, handleChange, handleSubmit, isValid } = useAuthForm('login');
 *
 *   const onSubmit = async (formData) => {
 *     const result = await login(formData);
 *     if (result.success) navigate('/');
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input name="email" value={values.email} onChange={handleChange} />
 *       {errors.email && <span>{errors.email}</span>}
 *       <button disabled={!isValid}>Login</button>
 *     </form>
 *   );
 * }
 */

export const useAuthForm = (formType = "login") => {
  const initialValues =
    formType === "login"
      ? { email: "", password: "" }
      : { firstName: "", lastName: "", email: "", password: "" };

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Manejar blur (para mostrar errores)
  const handleBlur = (e) => {
    const { name } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validar campo individual
    validateField(name);
  };

  // Validar un campo específico
  const validateField = (fieldName) => {
    const validation =
      formType === "login"
        ? validateLoginForm(values)
        : validateRegisterForm(values);

    if (validation.errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: validation.errors[fieldName],
      }));
    }
  };

  // Validar formulario completo
  const validate = () => {
    const validation =
      formType === "login"
        ? validateLoginForm(values)
        : validateRegisterForm(values);

    setErrors(validation.errors);
    return validation.isValid;
  };

  // Manejar submit
  const handleSubmit = (onSubmit) => async (e) => {
    e.preventDefault();

    // Marcar todos los campos como touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validar
    if (!validate()) {
      console.log("Formulario inválido:", errors);
      return;
    }

    // Formatear datos antes de enviar
    const formattedData =
      formType === "login"
        ? formatLoginData(values)
        : formatRegisterData(values);

    // Ejecutar callback con datos formateados
    await onSubmit(formattedData);
  };

  // Limpiar formulario
  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  // Verificar si el formulario es válido
  const isValid =
    Object.keys(errors).length === 0 &&
    Object.keys(values).every((key) => values[key].trim() !== "");

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset,
    isValid,
  };
};
