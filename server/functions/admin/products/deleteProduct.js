import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import {
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import { deleteFromS3, getS3KeyFromUrl } from "../../../utils/s3.js";
import { success, notFound, serverError } from "../../../utils/responses.js";

const deleteProductHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Verificar que el producto existe
    const productResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!productResult.Item) {
      return notFound("Producto no encontrado");
    }

    const product = productResult.Item;

    // Verificar si el producto está referenciado en órdenes
    // Buscar ORDER_ITEMS que contengan este producto
    const orderItemsResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :productPK",
        ExpressionAttributeValues: {
          ":productPK": `PRODUCT#${id}`,
        },
        ProjectionExpression: "PK, SK",
      }),
    );

    const hasOrderReferences = orderItemsResult.Items.length > 0;

    // Si tiene referencias en órdenes => SOFT DELETE
    if (hasOrderReferences) {
      const result = await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `PRODUCT#${id}`,
            SK: "METADATA",
          },
          UpdateExpression:
            "SET is_active = :isActive, updated_at = :updatedAt",
          ExpressionAttributeValues: {
            ":isActive": false,
            ":updatedAt": getTimestamp(),
          },
          ReturnValues: "ALL_NEW",
        }),
      );

      return success(
        {
          success: true,
          softDeleted: true,
          message:
            "Producto referenciado por órdenes. Se desactivó en lugar de eliminar para preservar historial.",
          product: {
            id: result.Attributes.id,
            name: result.Attributes.name,
            is_active: result.Attributes.is_active,
          },
        },
        200,
      );
    }

    // Eliminar imagen de S3 si existe
    if (product.image_url) {
      const imageKey = getS3KeyFromUrl(product.image_url);
      if (imageKey) {
        try {
          await deleteFromS3(imageKey);
        } catch (s3Error) {
          console.warn("Could not delete image from S3:", s3Error.message);
          // No falla la operación si no se puede eliminar la imagen
        }
      }
    }

    // Eliminar producto de DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${id}`,
          SK: "METADATA",
        },
      }),
    );

    return success({
      success: true,
      message: "Producto eliminado correctamente",
      product: {
        id: product.id,
        name: product.name,
      },
    });
  } catch (error) {
    console.error("❌ Error en deleteProduct:", error);
    return serverError("Error al eliminar producto");
  }
};

export const deleteProduct = requireAdmin(deleteProductHandler);
