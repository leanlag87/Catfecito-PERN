import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";

const updateOrderStatusHandler = async (event) => {
  try {
    const orderId = event.pathParameters?.id;
    const body = JSON.parse(event.body);
    const { status } = body;

    const validStatuses = [
      "pending",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    // Validar estado
    if (!status || !validStatuses.includes(status)) {
      return badRequest(
        `Estado inválido. Válidos: ${validStatuses.join(", ")}`,
      );
    }

    // Verificar que la orden existe
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

    // Actualizar estado en ORDER METADATA
    const timestamp = getTimestamp();

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET #status = :status, updated_at = :updated",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
          ":updated": timestamp,
        },
      }),
    );

    // Actualizar índice USER#ORDER
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${order.user_id}`,
          SK: `ORDER#${orderId}`,
        },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
        },
      }),
    );

    return success({
      success: true,
      message: "Estado de orden actualizado",
      order: {
        id: orderId,
        user_id: order.user_id,
        total: order.total,
        status: status,
        payment_status: order.payment_status,
        created_at: order.created_at,
        updated_at: timestamp,
      },
    });
  } catch (error) {
    console.error("Error en updateOrderStatus:", error);
    return serverError("Error al actualizar estado");
  }
};

export const updateOrderStatus = requireAdmin(updateOrderStatusHandler);
