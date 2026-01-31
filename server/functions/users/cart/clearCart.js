import { docClient, TABLE_NAME } from "../../../dynamodb.js";
import { QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../../utils/auth.js";
import { success, serverError } from "../../../utils/responses.js";

const clearCartHandler = async (event) => {
  try {
    const userId = event.user.id;

    console.log("🧹 Clearing cart for user:", userId);

    // Obtener todos los items del carrito
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": "CART#",
        },
        ProjectionExpression: "PK, SK",
      }),
    );

    if (!result.Items || result.Items.length === 0) {
      return success({
        success: true,
        message: "El carrito ya está vacío",
        deletedCount: 0,
      });
    }

    console.log(`📦 Found ${result.Items.length} items to delete`);

    // Eliminar items en batch (máximo 25 por batch)
    const deleteRequests = result.Items.map((item) => ({
      DeleteRequest: {
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      },
    }));

    // Dividir en batches de 25 (límite de DynamoDB)
    const batches = [];
    for (let i = 0; i < deleteRequests.length; i += 25) {
      batches.push(deleteRequests.slice(i, i + 25));
    }

    // Ejecutar batches
    for (const batch of batches) {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: batch,
          },
        }),
      );
    }

    console.log(`✅ Cart cleared: ${result.Items.length} items deleted`);

    return success({
      success: true,
      message: "Carrito vaciado exitosamente",
      deletedCount: result.Items.length,
    });
  } catch (error) {
    console.error("❌ Error en clearCart:", error);
    return serverError("Error al vaciar el carrito");
  }
};

export const clearCart = requireAuth(clearCartHandler);
