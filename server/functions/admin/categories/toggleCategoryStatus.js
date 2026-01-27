import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";

const toggleCategoryStatusHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    console.log(`🔄 Toggling category status for id: ${id}`);

    // Verificar que la categoría existe
    const currentCategoryResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!currentCategoryResult.Item) {
      return notFound("Categoría no encontrada");
    }

    const currentCategory = currentCategoryResult.Item;
    const newStatus = !currentCategory.is_active;

    console.log(
      `📝 Current status: ${currentCategory.is_active}, New status: ${newStatus}`,
    );

    // Actualizar estado de la categoría
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${id}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET is_active = :isActive, updated_at = :updatedAt",
        ExpressionAttributeValues: {
          ":isActive": newStatus,
          ":updatedAt": getTimestamp(),
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    console.log(
      `✅ Category ${newStatus ? "activated" : "deactivated"} successfully`,
    );

    return success({
      success: true,
      message: `Categoría ${newStatus ? "activada" : "desactivada"} exitosamente`,
      category: {
        id: result.Attributes.id,
        name: result.Attributes.name,
        description: result.Attributes.description,
        is_active: result.Attributes.is_active,
        updated_at: result.Attributes.updated_at,
      },
    });
  } catch (error) {
    console.error("❌ Error en toggleCategoryStatus:", error);
    return serverError("Error al cambiar estado de la categoría");
  }
};

export const toggleCategoryStatus = requireAdmin(toggleCategoryStatusHandler);
