import { docClient, TABLE_NAME } from "../../../dynamodb.js";
import { ScanCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import { success, serverError } from "../../../utils/responses.js";

const getAllOrdersHandler = async (event) => {
  try {
    // Scanea todas las órdenes (METADATA only)
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(PK, :pk) AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": "ORDER#",
          ":sk": "METADATA",
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

    // Obtener información de usuarios en batch
    const userIds = [...new Set(result.Items.map((order) => order.user_id))];
    const userKeys = userIds.map((id) => ({
      PK: `USER#${id}`,
      SK: "METADATA",
    }));

    const usersResult = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: userKeys,
          },
        },
      }),
    );

    const users = usersResult.Responses[TABLE_NAME] || [];
    const usersMap = {};
    users.forEach((user) => {
      const userId = user.PK.replace("USER#", "");
      usersMap[userId] = user;
    });

    // Contar items de cada orden y combinar con info de usuario
    const ordersWithDetails = await Promise.all(
      result.Items.map(async (order) => {
        const orderId = order.PK.replace("ORDER#", "");
        const user = usersMap[order.user_id] || {};

        // Contar items de la orden
        const itemsCount = await docClient.send(
          new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
              ":pk": `ORDER#${orderId}`,
              ":sk": "ITEM#",
            },
            Select: "COUNT",
          }),
        );

        return {
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
          items_count: itemsCount.Count,
        };
      }),
    );

    // Ordenar por fecha (más reciente primero)
    ordersWithDetails.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    return success({
      success: true,
      count: ordersWithDetails.length,
      orders: ordersWithDetails,
    });
  } catch (error) {
    console.error("Error en getAllOrders:", error);
    return serverError("Error al obtener órdenes");
  }
};

export const getAllOrders = requireAdmin(getAllOrdersHandler);
