import jwt from "jsonwebtoken";
import { docClient, TABLE_NAME } from "../../../dynamodb.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

/**
 * Lambda Authorizer optimizado
 */
export const handler = async (event) => {
  console.log("🔐 Authorizer invoked");

  try {
    // 1. Extraer token
    const authHeader =
      event.headers?.authorization || event.headers?.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No token provided");
      throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    // 2. Verificar firma del JWT (IMPORTANTE para seguridad)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("✅ Token válido para usuario:", decoded.id);

    // 3. Consultar rol actualizado desde DynamoDB
    // (Solo si necesitas roles actualizados en tiempo real)
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${decoded.id}`,
          SK: "METADATA",
        },
      }),
    );

    const roleFromDB = result.Item?.role || decoded.role || "user";

    // 4. Retornar política con contexto
    return generatePolicy(decoded.id, "Allow", event.routeArn, {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || "",
      role: roleFromDB,
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

  return authResponse;
}
