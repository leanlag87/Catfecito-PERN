import { sanitizeInput } from "../validations/auth.validation";
import { STORAGE_KEYS } from "../../../shared/constants";

/**
 * Auth Service - Funciones helper para autenticación
 *
 * Responsabilidades:
 * - Formatear datos antes de enviar al backend
 * - Normalizar respuestas del backend
 * - Manejar errores de auth de forma consistente
 * - Preparar datos para el store
 */

//Formatea datos de registro antes de enviar
export const formatRegisterData = ({
  firstName,
  lastName,
  email,
  password,
}) => {
  return {
    firstName: sanitizeInput(firstName),
    lastName: sanitizeInput(lastName),
    email: sanitizeInput(email).toLowerCase(),
    password, // No sanitizar contraseña (mantener caracteres especiales)
  };
};

//Formatea datos de login antes de enviar
export const formatLoginData = ({ email, password }) => {
  return {
    email: sanitizeInput(email).toLowerCase(),
    password,
  };
};

//Extrae y formatea token del response
export const extractToken = (response) => {
  // Manejar diferentes formatos de respuesta
  const token =
    response?.token ||
    response?.data?.token ||
    response?.accessToken ||
    response?.data?.accessToken;

  if (!token) {
    console.warn("No se encontró token en la respuesta:", response);
    return null;
  }

  return token;
};

//Maneja errores de autenticación de forma consistente
export const handleAuthError = (error) => {
  console.error("Auth Error:", error);

  // Si es un error de red
  if (!error.response && error.message === "Network Error") {
    return {
      message: "Error de conexión. Verifica tu internet.",
      code: "NETWORK_ERROR",
    };
  }

  // Si el backend respondió con error
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return {
          message: data?.message || "Datos inválidos",
          code: "INVALID_DATA",
        };

      case 401:
        return {
          message: data?.message || "Credenciales incorrectas",
          code: "INVALID_CREDENTIALS",
        };

      case 403:
        return {
          message: "No tienes permisos para realizar esta acción",
          code: "FORBIDDEN",
        };

      case 404:
        return {
          message: "Usuario no encontrado",
          code: "USER_NOT_FOUND",
        };

      case 409:
        return {
          message: data?.message || "El email ya está registrado",
          code: "EMAIL_EXISTS",
        };

      case 429:
        return {
          message: "Demasiados intentos. Intenta más tarde.",
          code: "TOO_MANY_REQUESTS",
        };

      case 500:
        return {
          message: "Error del servidor. Intenta más tarde.",
          code: "SERVER_ERROR",
        };

      default:
        return {
          message: data?.message || "Error desconocido",
          code: "UNKNOWN_ERROR",
        };
    }
  }

  // Error genérico
  return {
    message: error.message || "Error inesperado",
    code: "UNEXPECTED_ERROR",
  };
};

//Verifica si un token JWT está expirado
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    // Decodificar JWT (sin verificar firma, solo para leer exp)
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (!payload.exp) {
      console.warn("Token sin campo exp");
      return false; // Si no tiene exp, asumir que es válido
    }

    // exp está en segundos, Date.now() en milisegundos
    const isExpired = payload.exp * 1000 < Date.now();

    return isExpired;
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return true; // Si no se puede decodificar, asumir expirado
  }
};

//Obtiene tiempo restante del token en minutos
export const getTokenTimeRemaining = (token) => {
  if (!token) return 0;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (!payload.exp) return Infinity; // Token sin expiración

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeRemaining = expirationTime - currentTime;

    return Math.floor(timeRemaining / 1000 / 60); // Retorna minutos
  } catch (error) {
    console.error("Error al calcular tiempo restante:", error);
    return 0;
  }
};

//Formatea nombre completo
export const formatFullName = (user) => {
  if (!user) return "";

  const firstName = user.firstName || user.first_name || "";
  const lastName = user.lastName || user.last_name || "";

  return `${firstName} ${lastName}`.trim() || user.email || "Usuario";
};

//Verifica si el usuario tiene un rol específico
export const hasRole = (user, role) => {
  if (!user || !user.role) return false;

  if (Array.isArray(role)) {
    return role.includes(user.role);
  }

  return user.role === role;
};

//Verifica si el usuario es admin
export const isAdmin = (user) => {
  return hasRole(user, "admin");
};

//Prepara headers de autorización
export const getAuthHeaders = (token) => {
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
};

//Guarda datos de auth en localStorage de forma segura
export const saveAuthData = (token, user, refreshToken = null) => {
  try {
    if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    if (refreshToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return true;
  } catch (error) {
    console.error("Error al guardar datos de auth:", error);
    return false;
  }
};

//Recupera datos de auth de localStorage
export const loadAuthData = () => {
  try {
    const token =
      localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
      localStorage.getItem("token");
    const refreshToken =
      localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
      localStorage.getItem("refreshToken");
    const userStr =
      localStorage.getItem(STORAGE_KEYS.USER) || localStorage.getItem("user");

    if (!token || !userStr)
      return { token: null, refreshToken: null, user: null };

    if (isTokenExpired(token)) {
      clearAuthData();
      return { token: null, refreshToken: null, user: null };
    }

    // migración automática
    if (!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.removeItem("token");
    }
    if (refreshToken && !localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.removeItem("refreshToken");
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      localStorage.setItem(STORAGE_KEYS.USER, userStr);
      localStorage.removeItem("user");
    }

    return { token, refreshToken, user: JSON.parse(userStr) };
  } catch (error) {
    console.error("Error al cargar datos de auth:", error);
    clearAuthData();
    return { token: null, refreshToken: null, user: null };
  }
};

//Limpia datos de auth de localStorage
export const clearAuthData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    return true;
  } catch (error) {
    console.error("Error al limpiar datos de auth:", error);
    return false;
  }
};

// Normalizar respuesta de login (backend retorna 3 tokens)
export const normalizeLoginResponse = (response) => {
  return {
    token: response.token || response.IdToken, // Token principal
    accessToken: response.accessToken, // Para Cognito
    refreshToken: response.refreshToken, // Para renovar
  };
};

//Normaliza datos de usuario (ajustado a tu schema de DynamoDB)
export const normalizeUserData = (userData) => {
  if (!userData) return null;

  // Tu backend retorna: { id, cognitoUserId, name, email, role }
  const [firstName = "", lastName = ""] = (userData.name || "").split(" ");

  return {
    id: userData.id,
    cognitoUserId: userData.cognitoUserId,
    email: userData.email,
    name: userData.name,
    firstName,
    lastName,
    role: userData.role || "user",
    createdAt: userData.createdAt || userData.created_at,
  };
};
