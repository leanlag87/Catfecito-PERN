import { docClient, TABLE_NAME } from "../../../dynamodb.js";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import { success, serverError } from "../../../utils/responses.js";

const getAllUsersHandler = async (event) => {
  try {
    // Escanear todos los usuarios (solo items con SK = METADATA)
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "SK = :metadata",
        ExpressionAttributeValues: {
          ":metadata": "METADATA",
        },
      }),
    );

    // Transformar y ordenar usuarios
    const users = result.Items.map((item) => ({
      id: item.PK.replace("USER#", ""),
      name: item.name,
      email: item.email,
      role: item.role,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at,
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return success({
      success: true,
      count: users.length,
      users: users,
    });
  } catch (error) {
    console.error("Error en getAllUsers:", error);
    return serverError("Error al obtener usuarios");
  }
};

// Exportar con middleware de admin
export const getAllUsers = requireAdmin(getAllUsersHandler);
