import { unauthorized, forbidden } from "./responses.js";

/**
 * Middleware para verificar autenticación
 * Lee el usuario desde el contexto del Lambda Authorizer
 */
export const requireAuth = (handler) => {
  return async (event) => {
    try {
      // El authorizer ya validó el token y puso el usuario en el contexto
      if (!event.requestContext?.authorizer?.lambda) {
        return unauthorized("No autorizado");
      }

      const authContext = event.requestContext.authorizer.lambda;

      // Construir objeto usuario desde el contexto
      const user = {
        id: authContext.id,
        email: authContext.email,
        name: authContext.name,
        role: authContext.role,
      };
      // Agregar usuario al event para usarlo en el handler
      event.user = user;

      return await handler(event);
    } catch (error) {
      console.error("Auth error:", error);
      return unauthorized("Token inválido");
    }
  };
};

/**
 * Middleware para verificar rol de admin
 * Reemplaza al middleware isAdmin de Express
 */
export const requireAdmin = (handler) => {
  return requireAuth(async (event) => {
    if (event.user.role !== "admin") {
      return forbidden("Se requiere rol de administrador");
    }
    return await handler(event);
  });
};
