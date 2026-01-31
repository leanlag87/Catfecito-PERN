import { v4 as uuidv4 } from "uuid";
import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";

const updateCartItemHandler = async (event) => {
  try {
    const userId = event.user.id;
    const productId = event.pathParameters?.product_id;
    const body = JSON.parse(event.body);
    const { quantity } = body;

    console.log("🔄 Updating cart item:", { userId, productId, quantity });

    // Validaciones
    if (!quantity || parseInt(quantity) <= 0) {
      return badRequest("La cantidad debe ser mayor a 0");
    }

    const qty = parseInt(quantity);

    // Verificar que el producto existe en el carrito
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

    // Verificar que el producto sigue activo y tiene stock
    const productResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${productId}`,
          SK: "METADATA",
        },
      }),
    );

    if (!productResult.Item) {
      return notFound("Producto no encontrado");
    }

    const product = productResult.Item;

    if (!product.is_active) {
      return badRequest("El producto ya no está disponible");
    }

    if (product.stock < qty) {
      return badRequest(`Stock insuficiente. Disponible: ${product.stock}`);
    }

    // Actualizar cantidad en el carrito
    const timestamp = getTimestamp();

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `CART#${productId}`,
        },
        UpdateExpression: "SET quantity = :qty, updated_at = :updated",
        ExpressionAttributeValues: {
          ":qty": qty,
          ":updated": timestamp,
        },
      }),
    );

    // Calcular subtotal
    const subtotal = parseFloat(product.price) * qty;

    console.log("✅ Cart item updated");

    return success({
      success: true,
      message: "Cantidad actualizada",
      item: {
        quantity: qty,
        updated_at: timestamp,
        product_id: productId,
        product_name: product.name,
        product_price: product.price,
        product_stock: product.stock,
        product_image: product.image_url,
        subtotal: subtotal.toFixed(2),
      },
    });
  } catch (error) {
    console.error("❌ Error en updateCartItem:", error);
    return serverError("Error al actualizar item");
  }
};

export const updateCartItem = requireAuth(updateCartItemHandler);
