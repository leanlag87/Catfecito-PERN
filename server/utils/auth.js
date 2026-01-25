import jwt from "jsonwebtoken";
import { unauthorized, forbidden } from "./responses.js";
import { docClient, TABLE_NAME } from "../dynamodb.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

/**
 * Extrae y decodifica el usuario del token de Cognito (IdToken)
 * Reemplaza a verifyAccessToken() pero para tokens de Cognito
 */
export const getUserFromToken = async (event) => {
  const authHeader =
    event.headers?.authorization || event.headers?.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token no proporcionado");
  }

  const token = authHeader.split(" ")[1];

  // Decodificar token de Cognito (sin verificar firma)
  // API Gateway + Cognito Authorizer ya lo validó
  const decoded = jwt.decode(token);

  if (!decoded || !decoded.sub) {
    throw new Error("Token inválido");
  }

  // Obtener el rol actual desde DynamoDB
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${decoded.sub}`,
        SK: "METADATA",
      },
    }),
  );

  const roleFromDB = result.Item?.role || "user";

  return {
    id: decoded.sub, // Cognito User ID
    email: decoded.email,
    name: decoded.name,
    role: roleFromDB, // Rol desde DynamoDB (siempre actualizado)
    groups: decoded["cognito:groups"] || [],
  };
};

/**
 * Middleware para verificar autenticación
 * Reemplaza al middleware de Express
 */
export const requireAuth = (handler) => {
  return async (event) => {
    try {
      const user = await getUserFromToken(event);
      // Agregar usuario al event para usarlo en el handler
      event.user = user;
      return await handler(event);
    } catch (error) {
      console.error("Error de autenticación:", error);
      return unauthorized(error.message);
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
