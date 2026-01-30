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

    // SOLO DECODIFICAR (Cognito ya validó el token)
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.sub) {
      console.log("❌ Token inválido o sin sub");
      throw new Error("Unauthorized");
    }

    // Verificar decoded.sub O decoded.id
    const userId = decoded.sub;
    const email = decoded.email || decoded["cognito:username"];

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

    if (!result.Item) {
      console.log("❌ Usuario no encontrado en DynamoDB");
      throw new Error("Unauthorized");
    }

    const user = result.Item;

    console.log(`👤 Usuario: ${email} | Rol: ${user.role}`);

    // Retornar política con contexto
    return generatePolicy(userId, "Allow", event.routeArn, {
      id: userId,
      email: email,
      name: user.name || "",
      role: user.role || "user",
    });
  } catch (error) {
    console.error("❌ Authorizer error:", error.message);
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
