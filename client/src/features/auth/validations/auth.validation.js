// Validaciones de autenticacion

//Valida formato de email
export const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "El email es requerido" };
  }

  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { isValid: false, error: "El email es requerido" };
  }

  // Regex básico para email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: "El formato del email es inválido" };
  }

  return { isValid: true, error: null };
};

//Valida contraseña
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 6,
    requireUppercase = false,
    requireNumber = false,
    requireSpecial = false,
  } = options;

  if (!password || typeof password !== "string") {
    return { isValid: false, error: "La contraseña es requerida" };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `La contraseña debe tener al menos ${minLength} caracteres`,
    };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "La contraseña debe contener al menos una mayúscula",
    };
  }

  if (requireNumber && !/\d/.test(password)) {
    return {
      isValid: false,
      error: "La contraseña debe contener al menos un número",
    };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      error: "La contraseña debe contener al menos un carácter especial",
    };
  }

  return { isValid: true, error: null };
};

//Valida nombre (firstName o lastName)
export const validateName = (name, fieldName = "Nombre") => {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: `${fieldName} es requerido` };
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    return { isValid: false, error: `${fieldName} es requerido` };
  }

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: `${fieldName} debe tener al menos 2 caracteres`,
    };
  }

  if (trimmedName.length > 50) {
    return {
      isValid: false,
      error: `${fieldName} no puede tener más de 50 caracteres`,
    };
  }

  // Solo letras, espacios y tildes
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      error: `${fieldName} solo puede contener letras`,
    };
  }

  return { isValid: true, error: null };
};

//Valida formulario de LOGIN completo
export const validateLoginForm = ({ email, password }) => {
  const errors = {};

  // Validar email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }

  // Validar password (solo que exista, no formato)
  if (!password || !password.trim()) {
    errors.password = "La contraseña es requerida";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

//Valida formulario de REGISTER completo
export const validateRegisterForm = ({
  firstName,
  lastName,
  email,
  password,
}) => {
  const errors = {};

  // Validar firstName
  const firstNameValidation = validateName(firstName, "Nombre");
  if (!firstNameValidation.isValid) {
    errors.firstName = firstNameValidation.error;
  }

  // Validar lastName
  const lastNameValidation = validateName(lastName, "Apellido");
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.error;
  }

  // Validar email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }

  // Validar password (con requisitos)
  const passwordValidation = validatePassword(password, {
    minLength: 6,
    requireUppercase: false, // Cambiar a true si se quiere forzar
    requireNumber: false,
    requireSpecial: false,
  });
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

//Sanitiza input de usuario (prevenir XSS básico)
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "") // Elimina < y >
    .slice(0, 255); // Limita longitud
};
