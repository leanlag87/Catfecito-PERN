import { docClient, TABLE_NAME } from "../../dynamodb.js";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { success, serverError } from "../../utils/responses.js";

export const getAllCategories = async (event) => {
  try {
    // Scan con filtro para categorías activas
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType AND is_active = :isActive",
        ExpressionAttributeValues: {
          ":entityType": "CATEGORY",
          ":isActive": true,
        },
      }),
    );

    // Ordenar por nombre (ascendente)
    const categories = result.Items.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    // Formatear respuesta
    const formattedCategories = categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      is_active: c.is_active,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));

    return success({
      success: true,
      count: formattedCategories.length,
      categories: formattedCategories,
    });
  } catch (error) {
    console.error("❌ Error en getAllCategories:", error);
    return serverError("Error al obtener categorías");
  }
};
