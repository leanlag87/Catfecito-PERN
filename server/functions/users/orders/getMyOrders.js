import { docClient, TABLE_NAME } from "../../../dynamodb.js";
import { QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../../utils/auth.js";
import { success, serverError } from "../../../utils/responses.js";

const getMyOrdersHandler = async (event) => {
  try {
    const userId = event.user.id;

    //Obtener índice de órdenes del usuario
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": "ORDER#",
        },
      }),
    );

    if (!result.Items || result.Items.length === 0) {
      return success({
        success: true,
        count: 0,
        orders: [],
      });
    }

    // Obtener metadata completa de cada orden en batch
    const orderKeys = result.Items.map((item) => ({
      PK: item.SK, // SK contiene "ORDER#{orderId}"
      SK: "METADATA",
    }));

    const ordersResult = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: orderKeys,
          },
        },
      }),
    );

    const orders = ordersResult.Responses[TABLE_NAME] || [];

    //Contar items de cada orden
    const ordersWithItemCount = await Promise.all(
      orders.map(async (order) => {
        const orderId = order.PK.replace("ORDER#", "");

        // Query items de la orden
        const itemsResult = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
              ":pk": order.PK,
              ":sk": "ITEM#",
            },
            Select: "COUNT",
          }),
        );

        return {
          id: orderId,
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
          items_count: itemsResult.Count,
        };
      }),
    );

    // Ordenar por fecha (más reciente primero)
    ordersWithItemCount.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    return success({
      success: true,
      count: ordersWithItemCount.length,
      orders: ordersWithItemCount,
    });
  } catch (error) {
    console.error("Error en getMyOrders:", error);
    return serverError("Error al obtener órdenes");
  }
};

export const getMyOrders = requireAuth(getMyOrdersHandler);
