import { docClient, TABLE_NAME } from "../../dynamodb.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../utils/auth.js";
import { success, notFound, serverError } from "../../utils/responses.js";

const getProfileHandler = async (event) => {
  console.log("🔍 Event received:", JSON.stringify(event, null, 2));
  console.log("👤 User from token:", event.user);

  try {
    const user = event.user; // Inyectado por requireAuth

    if (!user || !user.id) {
      console.error("❌ No user or user.id found");
      return serverError("Error de autenticación");
    }

    console.log("🔍 Searching for user:", user.id);
    console.log("📊 Table name:", TABLE_NAME);
    console.log("🔑 Key:", { PK: `USER#${user.id}`, SK: "METADATA" });

    // Buscar usuario en DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${user.id}`,
          SK: "METADATA",
        },
      }),
    );

    console.log("📦 DynamoDB result:", JSON.stringify(result, null, 2));

    if (!result.Item) {
      console.error("❌ User not found in DynamoDB");
      return notFound("Usuario no encontrado");
    }

    console.log("✅ User found:", result.Item);

    // Preparar datos del usuario
    const userData = {
      id: user.id,
      name: result.Item.name,
      email: result.Item.email,
      role: result.Item.role,
      is_active: result.Item.is_active,
      created_at: result.Item.created_at,
      updated_at: result.Item.updated_at,
      // Campos de dirección opcionales
      default_country: result.Item.default_country,
      default_address: result.Item.default_address,
      default_address2: result.Item.default_address2,
      default_city: result.Item.default_city,
      default_state: result.Item.default_state,
      default_zip: result.Item.default_zip,
      default_phone: result.Item.default_phone,
    };

    console.log("✅ Returning user data");

    return success({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("❌ Error en getProfile:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    return serverError("Error al obtener perfil");
  }
};

// Exportar con middleware de autenticación
export const getProfile = requireAuth(getProfileHandler);
