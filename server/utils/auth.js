import { unauthorized, forbidden } from "./responses.js";

/**
 * Extrae y decodifica el usuario del token de Cognito (IdToken)
 * Reemplaza a verifyAccessToken() pero para tokens de Cognito
 */
export const getUserFromToken = async (event) => {
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

      console.log(`🔓 Usuario autenticado: ${user.email} (${user.role})`);

      // Agregar usuario al event para usarlo en el handler
      event.user = user;

      return await handler(event);
    } catch (error) {
      console.error("❌ Auth error:", error);
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
      console.log(`⛔ Acceso denegado: ${event.user.email} no es admin`);
      return forbidden("Se requiere rol de administrador");
    }

    console.log(`✅ Admin verificado: ${event.user.email}`);
    return await handler(event);
  });
};
