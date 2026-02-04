import { docClient, TABLE_NAME } from "../../dynamodb.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../utils/auth.js";
import { success, notFound, serverError } from "../../utils/responses.js";

const getPaymentStatusHandler = async (event) => {
  try {
    const userId = event.user.id;
    const orderId = event.pathParameters?.order_id;

    console.log("📊 Getting payment status:", { userId, orderId });

    // Verificar que la orden existe y pertenece al usuario
    const orderIndexResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `ORDER#${orderId}`,
        },
      }),
    );

    if (!orderIndexResult.Item) {
      return notFound("Orden no encontrada");
    }

    // Obtener metadata completa de la orden
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

    console.log(`✅ Payment status retrieved for order: ${orderId}`);

    return success({
      success: true,
      order: {
        id: orderId,
        user_id: order.user_id,
        total: order.total,
        status: order.status,
        payment_status: order.payment_status,
        payment_id: order.payment_id || null,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
    });
  } catch (error) {
    console.error("Error en getPaymentStatus:", error);
    return serverError("Error al obtener estado del pago");
  }
};

export const getPaymentStatus = requireAuth(getPaymentStatusHandler);
