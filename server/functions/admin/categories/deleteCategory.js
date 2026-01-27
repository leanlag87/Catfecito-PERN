import { docClient, TABLE_NAME } from "../../../dynamodb.js";
import { GetCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";

const deleteCategoryHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    console.log(`🗑️ Attempting to delete category: ${id}`);

    // 1. Verificar que la categoría existe
    const categoryResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!categoryResult.Item) {
      return notFound("Categoría no encontrada");
    }

    const category = categoryResult.Item;

    // 2. Verificar si hay productos asociados a esta categoría
    const productsResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :categoryPK",
        ExpressionAttributeValues: {
          ":categoryPK": `CATEGORY#${id}`,
        },
        Select: "COUNT",
      }),
    );

    const productsCount = productsResult.Count || 0;

    console.log(`📊 Found ${productsCount} products associated with category`);

    // 3. Si hay productos asociados, no permitir eliminación
    if (productsCount > 0) {
      return badRequest(
        `No se puede eliminar la categoría. Tiene ${productsCount} producto(s) asociado(s).`,
      );
    }

    // 4. No hay productos asociados => Eliminar categoría
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${id}`,
          SK: "METADATA",
        },
      }),
    );

    console.log("✅ Category deleted successfully:", id);

    return success({
      success: true,
      message: "Categoría eliminada exitosamente",
      category: {
        id: category.id,
        name: category.name,
      },
    });
  } catch (error) {
    console.error("❌ Error en deleteCategory:", error);
    return serverError("Error al eliminar categoría");
  }
};

export const deleteCategory = requireAdmin(deleteCategoryHandler);
