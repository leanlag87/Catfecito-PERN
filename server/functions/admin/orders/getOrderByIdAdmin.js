import { docClient, TABLE_NAME } from "../../../dynamodb.js";
import {
  GetCommand,
  QueryCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";

const getOrderByIdAdminHandler = async (event) => {
  try {
    const orderId = event.pathParameters?.id;

    //  Obtener metadata de la orden
    const orderResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: "METADATA",
        },
      }),
    );

    if (!orderResult.Item) {
      return notFound("Orden no encontrada");
    }

    const order = orderResult.Item;

    //  Obtener información del usuario
    const userResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${order.user_id}`,
          SK: "METADATA",
        },
      }),
    );

    const user = userResult.Item || {};

    // Obtener items de la orden
    const itemsResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `ORDER#${orderId}`,
          ":sk": "ITEM#",
        },
      }),
    );

    if (!itemsResult.Items || itemsResult.Items.length === 0) {
      return success({
        success: true,
        order: {
          id: orderId,
          user_id: order.user_id,
          user_name: user.name || "N/A",
          user_email: user.email || "N/A",
          total: order.total,
          status: order.status,
          payment_status: order.payment_status,
          shipping_first_name: order.shipping_first_name,
          shipping_last_name: order.shipping_last_name,
          shipping_country: order.shipping_country,
          shipping_address: order.shipping_address,
          shipping_address2: order.shipping_address2,
          shipping_city: order.shipping_city,
          shipping_state: order.shipping_state,
          shipping_zip: order.shipping_zip,
          shipping_phone: order.shipping_phone,
          created_at: order.created_at,
          updated_at: order.updated_at,
          items: [],
        },
      });
    }

    // Obtener información completa de productos en batch
    const productIds = itemsResult.Items.map((item) => item.product_id);
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
    const productsMap = {};
    products.forEach((product) => {
      const productId = product.PK.replace("PRODUCT#", "");
      productsMap[productId] = product;
    });

    // Combinar items con información de productos
    const items = itemsResult.Items.map((item) => {
      const product = productsMap[item.product_id];

      return {
        id: item.SK.replace("ITEM#", ""),
        product_id: item.product_id,
        product_name: product?.name || "Producto no disponible",
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        image_url: product?.image_url || null,
      };
    });

    return success({
      success: true,
      order: {
        id: orderId,
        user_id: order.user_id,
        user_name: user.name || "N/A",
        user_email: user.email || "N/A",
        total: order.total,
        status: order.status,
        payment_status: order.payment_status,
        shipping_first_name: order.shipping_first_name,
        shipping_last_name: order.shipping_last_name,
        shipping_country: order.shipping_country,
        shipping_address: order.shipping_address,
        shipping_address2: order.shipping_address2,
        shipping_city: order.shipping_city,
        shipping_state: order.shipping_state,
        shipping_zip: order.shipping_zip,
        shipping_phone: order.shipping_phone,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: items,
      },
    });
  } catch (error) {
    console.error("Error en getOrderByIdAdmin:", error);
    return serverError("Error al obtener la orden");
  }
};

export const getOrderByIdAdmin = requireAdmin(getOrderByIdAdminHandler);
