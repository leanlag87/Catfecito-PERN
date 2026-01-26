import { docClient, TABLE_NAME } from "../../dynamodb.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { success, notFound, serverError } from "../../utils/responses.js";

export const getCategoryById = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Obtener categoría de DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!result.Item) {
      return notFound("Categoría no encontrada");
    }

    const category = result.Item;

    // Formatear respuesta
    return success({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        image_url: category.image_url,
        is_active: category.is_active,
        created_at: category.created_at,
        updated_at: category.updated_at,
      },
    });
  } catch (error) {
    console.error("❌ Error en getCategoryById:", error);
    return serverError("Error al obtener categoría");
  }
};
