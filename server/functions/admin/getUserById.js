import { docClient, TABLE_NAME } from "../../dynamodb.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../utils/auth.js";
import { success, notFound, serverError } from "../../utils/responses.js";

const getUserByIdHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Obtener usuario de DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!result.Item) {
      return notFound("Usuario no encontrado");
    }

    // Preparar datos del usuario
    const user = {
      id: id,
      name: result.Item.name,
      email: result.Item.email,
      role: result.Item.role,
      is_active: result.Item.is_active,
      created_at: result.Item.created_at,
      updated_at: result.Item.updated_at,
    };

    return success({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Error en getUserById:", error);
    return serverError("Error al obtener usuario");
  }
};

// Exportar con middleware de admin
export const getUserById = requireAdmin(getUserByIdHandler);
