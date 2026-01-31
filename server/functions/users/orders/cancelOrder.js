import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  forbidden,
  serverError,
} from "../../../utils/responses.js";

const cancelOrderHandler = async (event) => {
  try {
    const userId = event.user.id;
    const userRole = event.user.role;
    const isAdmin = userRole === "admin";
    const orderId = event.pathParameters?.id;

    // Obtener la orden
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

    // Verificar permisos: dueño o admin
    if (!isAdmin && order.user_id !== userId) {
      return forbidden("No autorizado para cancelar esta orden");
    }

    // Validar que no esté pagada/aprobada
    if (order.status === "paid" || order.payment_status === "approved") {
      return badRequest("No se puede cancelar una orden ya pagada");
    }

    // Actualizar estado a cancelled
    const timestamp = getTimestamp();

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: "METADATA",
        },
        UpdateExpression:
          "SET #status = :cancelled, payment_status = :cancelled_payment, updated_at = :updated",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":cancelled": "cancelled",
          ":cancelled_payment": "cancelled",
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
        UpdateExpression:
          "SET #status = :cancelled, payment_status = :cancelled_payment",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":cancelled": "cancelled",
          ":cancelled_payment": "cancelled",
        },
      }),
    );

    return success({
      success: true,
      message: "Orden cancelada exitosamente",
      order: {
        id: orderId,
        user_id: order.user_id,
        total: order.total,
        status: "cancelled",
        payment_status: "cancelled",
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
        updated_at: timestamp,
      },
    });
  } catch (error) {
    console.error("Error en cancelOrder:", error);
    return serverError("Error al cancelar la orden");
  }
};

export const cancelOrder = requireAuth(cancelOrderHandler);
