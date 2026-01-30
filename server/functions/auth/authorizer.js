import jwt from "jsonwebtoken";
import { docClient, TABLE_NAME } from "../../dynamodb.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  console.log("🔐 Authorizer invoked");

  try {
    // Extraer token
    const authHeader =
      event.headers?.authorization || event.headers?.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No token provided");
      throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    // Verificar firma del JWT (IMPORTANTE para seguridad)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar decoded.sub O decoded.id
    const userId = decoded.sub || decoded.id;

    console.log("✅ Token válido para usuario:", userId);
    console.log("📋 Token completo:", JSON.stringify(decoded));

    // Consultar rol actualizado desde DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "METADATA",
        },
      }),
    );

    const roleFromDB = result.Item?.role || decoded.role || "user";
    console.log(`👤 Usuario: ${decoded.email} | Rol: ${roleFromDB}`);

    // Retornar política con contexto
    return generatePolicy(userId, "Allow", event.routeArn, {
      id: userId,
      email: decoded.email,
      name: decoded.name || "",
      role: roleFromDB,
    });
  } catch (error) {
    console.error("❌ Authorizer error:", error.message);

    // JWT expirado o inválido
    if (error.name === "TokenExpiredError") {
      console.log("⏰ Token expirado");
    } else if (error.name === "JsonWebTokenError") {
      console.log("🔒 Token inválido");
    }

    throw new Error("Unauthorized");
  }
};

/**
 * Genera política de autorización
 */
function generatePolicy(principalId, effect, resource, context = {}) {
  const authResponse = {
    principalId: principalId,
  };

  if (effect && resource) {
    authResponse.policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    };
  }

  // Contexto: solo valores primitivos (string, number, boolean)
  if (Object.keys(context).length > 0) {
    authResponse.context = context;
  }

  console.log("✅ Política generada:", JSON.stringify(authResponse));

  return authResponse;
}
