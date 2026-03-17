/**
 * Profile Service - Funciones helper para perfil de usuario
 *
 * Responsabilidades:
 * - Normalizar datos de perfil y direcciones
 * - Validar datos de perfil
 * - Formatear información de usuario
 * - Helpers para direcciones
 * - Validación de contraseñas
 */

//Normaliza perfil del backend

export const normalizeProfile = (profile) => {
  if (!profile) return null;

  return {
    id: profile.id || profile.user_id,
    name: profile.name || "",
    email: profile.email || "",
    role: profile.role || "user",

    // Dirección predeterminada
    defaultCountry: profile.default_country || "",
    defaultAddress: profile.default_address || "",
    defaultAddress2: profile.default_address2 || "",
    defaultCity: profile.default_city || "",
    defaultState: profile.default_state || "",
    defaultZip: profile.default_zip || "",
    defaultPhone: profile.default_phone || "",

    // Metadata
    createdAt: profile.created_at || profile.createdAt || null,
    updatedAt: profile.updated_at || profile.updatedAt || null,
  };
};

//Normaliza dirección del backend
export const normalizeAddress = (address) => {
  if (!address) return null;

  return {
    id: address.id,
    userId: address.user_id || address.userId,
    country: address.country || "",
    address: address.address || "",
    address2: address.address2 || "",
    city: address.city || "",
    state: address.state || "",
    zip: address.zip || "",
    phone: address.phone || "",
    isDefault: address.is_default || false,
    createdAt: address.created_at || address.createdAt || null,
    updatedAt: address.updated_at || address.updatedAt || null,
  };
};

//Normaliza array de direcciones
export const normalizeAddresses = (addresses) => {
  if (!Array.isArray(addresses)) return [];
  return addresses.map(normalizeAddress).filter(Boolean);
};

//Formatea nombre completo (capitaliza)
export const formatFullName = (name) => {
  if (!name || typeof name !== "string") return "";

  return name
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

//Obtiene iniciales del nombre
export const getNameInitials = (name) => {
  if (!name || typeof name !== "string") return "";

  const words = name.trim().split(" ");

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

//Formatea número de teléfono
export const formatPhoneNumber = (phone) => {
  if (!phone || typeof phone !== "string") return "";

  // Remover caracteres no numéricos excepto el +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Si empieza con +, mantenerlo
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // Argentina: +54 9 11 1234-5678
  if (cleaned.length === 10) {
    return `+54 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }

  return cleaned;
};

//Formatea dirección completa
export const formatFullAddress = (address) => {
  if (!address) return "";

  const parts = [
    address.address || address.default_address,
    address.address2 || address.default_address2,
    address.city || address.default_city,
    address.state || address.default_state,
    address.zip || address.default_zip,
    address.country || address.default_country,
  ].filter(Boolean);

  return parts.join(", ");
};

//Valida datos de perfil
export const validateProfileData = (profileData) => {
  const errors = {};

  // Validar nombre
  if (!profileData.name || profileData.name.trim().length < 2) {
    errors.name = "El nombre debe tener al menos 2 caracteres";
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!profileData.email || !emailRegex.test(profileData.email)) {
    errors.email = "Email inválido";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

//Valida datos de dirección
export const validateAddressData = (addressData) => {
  const errors = {};

  // País
  if (!addressData.country || !addressData.default_country) {
    errors.country = "El país es requerido";
  }

  // Dirección
  const address = addressData.address || addressData.default_address || "";
  if (address.trim().length < 5) {
    errors.address = "La dirección debe tener al menos 5 caracteres";
  }

  // Ciudad
  const city = addressData.city || addressData.default_city || "";
  if (city.trim().length < 2) {
    errors.city = "La ciudad es requerida";
  }

  // Estado/Provincia
  const state = addressData.state || addressData.default_state || "";
  if (state.trim().length < 2) {
    errors.state = "La provincia/estado es requerida";
  }

  // Código postal
  const zip = addressData.zip || addressData.default_zip || "";
  if (zip.trim().length < 3) {
    errors.zip = "El código postal debe tener al menos 3 caracteres";
  }

  // Teléfono
  const phone = addressData.phone || addressData.default_phone || "";
  if (phone.trim().length < 8) {
    errors.phone = "El teléfono debe tener al menos 8 caracteres";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

//Valida contraseña
export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Debe contener al menos una mayúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Debe contener al menos una minúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Debe contener al menos un número");
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
};

//Calcula fortaleza de contraseña (0-100)
export const calculatePasswordStrength = (password) => {
  let strength = 0;

  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 15;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 10;
  if (/[^A-Za-z0-9]/.test(password)) strength += 10;

  return Math.min(strength, 100);
};

//Obtiene etiqueta de fortaleza de contraseña
export const getPasswordStrengthLabel = (strength) => {
  if (strength < 40) return { label: "Débil", color: "#e74c3c" };
  if (strength < 70) return { label: "Media", color: "#f39c12" };
  return { label: "Fuerte", color: "#4caf50" };
};

//Valida cambio de contraseña
export const validatePasswordChange = (
  currentPassword,
  newPassword,
  confirmPassword,
) => {
  const errors = {};

  if (!currentPassword) {
    errors.currentPassword = "La contraseña actual es requerida";
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    errors.newPassword = passwordValidation.errors[0];
  }

  if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden";
  }

  if (currentPassword === newPassword) {
    errors.newPassword = "La nueva contraseña debe ser diferente a la actual";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

//Prepara datos de perfil para enviar al backend
export const prepareProfileData = (profileData) => {
  return {
    name: profileData.name?.trim(),
    default_country: profileData.defaultCountry || profileData.default_country,
    default_address: profileData.defaultAddress || profileData.default_address,
    default_address2:
      profileData.defaultAddress2 || profileData.default_address2,
    default_city: profileData.defaultCity || profileData.default_city,
    default_state: profileData.defaultState || profileData.default_state,
    default_zip: profileData.defaultZip || profileData.default_zip,
    default_phone: profileData.defaultPhone || profileData.default_phone,
  };
};

//Prepara datos de dirección para enviar al backend
export const prepareAddressData = (addressData) => {
  return {
    country: addressData.country?.trim(),
    address: addressData.address?.trim(),
    address2: addressData.address2?.trim() || "",
    city: addressData.city?.trim(),
    state: addressData.state?.trim(),
    zip: addressData.zip?.trim(),
    phone: addressData.phone?.trim(),
    is_default: addressData.isDefault || false,
  };
};

//Obtiene dirección predeterminada de una lista
export const getDefaultAddress = (addresses) => {
  if (!Array.isArray(addresses)) return null;

  return (
    addresses.find((addr) => addr.isDefault || addr.is_default) ||
    addresses[0] ||
    null
  );
};

//Verifica si el perfil está completo
export const isProfileComplete = (profile) => {
  if (!profile) return false;

  const requiredFields = [
    profile.name,
    profile.email,
    profile.defaultCountry || profile.default_country,
    profile.defaultAddress || profile.default_address,
    profile.defaultCity || profile.default_city,
    profile.defaultZip || profile.default_zip,
  ];

  return requiredFields.every(
    (field) => field && field.toString().trim().length > 0,
  );
};

//Obtiene porcentaje de completitud del perfil
export const getProfileCompleteness = (profile) => {
  if (!profile) return 0;

  const fields = [
    profile.name,
    profile.email,
    profile.defaultCountry || profile.default_country,
    profile.defaultAddress || profile.default_address,
    profile.defaultCity || profile.default_city,
    profile.defaultState || profile.default_state,
    profile.defaultZip || profile.default_zip,
    profile.defaultPhone || profile.default_phone,
  ];

  const completed = fields.filter(
    (field) => field && field.toString().trim().length > 0,
  ).length;

  return Math.round((completed / fields.length) * 100);
};

//Sanitiza datos de entrada
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "") // Remover < y >
    .slice(0, 500); // Limitar longitud
};

//Valida código postal según país
export const validateZipCode = (zip, country) => {
  if (!zip) return false;

  const patterns = {
    Argentina: /^\d{4}$/,
    Colombia: /^\d{6}$/,
    Chile: /^\d{7}$/,
    Perú: /^\d{5}$/,
    México: /^\d{5}$/,
  };

  const pattern = patterns[country];
  return pattern ? pattern.test(zip) : zip.length >= 3;
};
