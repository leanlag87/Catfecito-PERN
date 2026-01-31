import { docClient, TABLE_NAME } from "../../../dynamodb.js";
import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";

const removeCartItemHandler = async (event) => {
  try {
    const userId = event.user.id;
    const productId = event.pathParameters?.product_id;

    console.log("🗑️ Removing cart item:", { userId, productId });

    // 1. Verificar que el item existe en el carrito
    const cartItemResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `CART#${productId}`,
        },
      }),
    );

    if (!cartItemResult.Item) {
      return notFound("Item no encontrado en tu carrito");
    }

    // 2. Eliminar el item
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `CART#${productId}`,
        },
      }),
    );

    console.log("✅ Cart item removed");

    return success({
      success: true,
      message: "Producto eliminado del carrito",
      item: {
        product_id: productId,
      },
    });
  } catch (error) {
    console.error("❌ Error en removeCartItem:", error);
    return serverError("Error al eliminar item");
  }
};

export const removeCartItem = requireAuth(removeCartItemHandler);
