import { docClient, TABLE_NAME } from "../../../dynamodb.js";
import { QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../../utils/auth.js";
import { success, serverError } from "../../../utils/responses.js";

const getCartHandler = async (event) => {
  try {
    const userId = event.user.id;

    console.log("🛒 Getting cart for user:", userId);

    // Obtener todos los items del carrito del usuario
    const cartResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": "CART#",
        },
      }),
    );

    if (!cartResult.Items || cartResult.Items.length === 0) {
      return success({
        success: true,
        count: 0,
        total: "0.00",
        items: [],
      });
    }

    console.log(`📦 Found ${cartResult.Items.length} cart items`);

    // Obtener información de los productos en batch
    const productIds = cartResult.Items.map((item) => item.product_id);

    const productKeys = productIds.map((id) => ({
      PK: `PRODUCT#${id}`,
      SK: "METADATA",
    }));

    const productsResult = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: productKeys,
          },
        },
      }),
    );

    const products = productsResult.Responses[TABLE_NAME] || [];

    // Crear un mapa de productos para fácil acceso
    const productsMap = {};
    products.forEach((product) => {
      const productId = product.PK.replace("PRODUCT#", "");
      productsMap[productId] = product;
    });

    // Combinar información del carrito con productos
    const items = cartResult.Items.map((cartItem) => {
      const product = productsMap[cartItem.product_id];

      if (!product) {
        console.warn(`⚠️ Producto no encontrado: ${cartItem.product_id}`);
        return null;
      }

      const subtotal = parseFloat(product.price) * parseInt(cartItem.quantity);

      return {
        id: cartItem.SK.replace("CART#", ""), // ID del cart item
        quantity: cartItem.quantity,
        created_at: cartItem.created_at,
        updated_at: cartItem.updated_at,
        product_id: cartItem.product_id,
        product_name: product.name,
        product_description: product.description,
        product_price: product.price,
        product_stock: product.stock,
        product_image: product.image_url,
        product_is_active: product.is_active,
        subtotal: subtotal.toFixed(2),
      };
    }).filter(Boolean); // Eliminar items con productos no encontrados

    // Calcular total del carrito
    const total = items.reduce(
      (sum, item) => sum + parseFloat(item.subtotal),
      0,
    );

    console.log(
      `✅ Cart retrieved: ${items.length} items, total: $${total.toFixed(2)}`,
    );

    return success({
      success: true,
      count: items.length,
      total: total.toFixed(2),
      items: items,
    });
  } catch (error) {
    console.error("❌ Error en getCart:", error);
    return serverError("Error al obtener el carrito");
  }
};

export const getCart = requireAuth(getCartHandler);
