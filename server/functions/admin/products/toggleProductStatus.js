import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";

const toggleProductStatusHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Verificar que el producto existe
    const currentProductResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!currentProductResult.Item) {
      return notFound("Producto no encontrado");
    }

    const currentProduct = currentProductResult.Item;
    const newStatus = !currentProduct.is_active;

    // Actualizar estado del producto
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${id}`,
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

    return success({
      success: true,
      message: `Producto ${newStatus ? "activado" : "desactivado"} exitosamente`,
      product: {
        id: result.Attributes.id,
        name: result.Attributes.name,
        is_active: result.Attributes.is_active,
        updated_at: result.Attributes.updated_at,
      },
    });
  } catch (error) {
    console.error("❌ Error en toggleProductStatus:", error);
    return serverError("Error al cambiar estado del producto");
  }
};

export const toggleProductStatus = requireAdmin(toggleProductStatusHandler);
