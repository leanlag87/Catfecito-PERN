import { docClient, TABLE_NAME, getTimestamp } from "../../dynamodb.js";
import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { payment } from "../../libs/mercadopago.js";
import { success } from "../../utils/responses.js";

const webhookHandler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { type, data } = body;

    // Procesamos sólo notificaciones de payment
    if (type !== "payment") {
      return success({ success: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return success({ success: true });
    }

    // Obtener información del pago de MercadoPago
    const paymentRaw = await payment.get({ id: paymentId });
    const paymentInfo = paymentRaw?.body || paymentRaw;

    const externalReference = paymentInfo?.external_reference?.toString(); // order_id
    const status = paymentInfo?.status; // approved, rejected, pending, etc.

    if (!externalReference) {
      return success({ success: true });
    }

    // Verificar que la orden existe
    const orderResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORDER#${externalReference}`,
          SK: "METADATA",
        },
      }),
    );

    if (!orderResult.Item) {
      return success({ success: true });
    }

    const order = orderResult.Item;

    // Idempotencia: si ya está aprobada/paid no hacemos nada
    if (order.payment_status === "approved" || order.status === "paid") {
      return success({ success: true });
    }

    const timestamp = getTimestamp();

    // Procesar según el estado del pago
    if (status === "approved") {
      // 4.1 Obtener items de la orden
      const itemsResult = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": `ORDER#${externalReference}`,
            ":sk": "ITEM#",
          },
        }),
      );

      const items = itemsResult.Items || [];

      // Obtener items del carrito del usuario
      const cartResult = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": `USER#${order.user_id}`,
            ":sk": "CART#",
          },
        }),
      );

      const cartItems = cartResult.Items || [];

      // Preparar transacción atómica (todo o nada)
      const transactItems = [];

      // Actualizar ORDER METADATA
      transactItems.push({
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `ORDER#${externalReference}`,
            SK: "METADATA",
          },
          UpdateExpression:
            "SET #status = :paid, payment_status = :approved, payment_id = :paymentId, updated_at = :updated",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":paid": "paid",
            ":approved": "approved",
            ":paymentId": paymentId.toString(),
            ":updated": timestamp,
          },
        },
      });

      // Actualizar índice USER#ORDER
      transactItems.push({
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${order.user_id}`,
            SK: `ORDER#${externalReference}`,
          },
          UpdateExpression: "SET #status = :paid, payment_status = :approved",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":paid": "paid",
            ":approved": "approved",
          },
        },
      });

      // Decrementar stock de cada producto
      for (const item of items) {
        transactItems.push({
          Update: {
            TableName: TABLE_NAME,
            Key: {
              PK: `PRODUCT#${item.product_id}`,
              SK: "METADATA",
            },
            UpdateExpression: "SET stock = stock - :qty, updated_at = :updated",
            ConditionExpression: "stock >= :qty", // Falla si no hay stock suficiente
            ExpressionAttributeValues: {
              ":qty": item.quantity,
              ":updated": timestamp,
            },
          },
        });
      }

      // Eliminar items del carrito (máximo 100 operaciones en TransactWrite)
      for (const cartItem of cartItems) {
        if (transactItems.length >= 100) {
          break;
        }

        transactItems.push({
          Delete: {
            TableName: TABLE_NAME,
            Key: {
              PK: `USER#${order.user_id}`,
              SK: `CART#${cartItem.product_id}`,
            },
          },
        });
      }

      // Ejecutar transacción atómica
      await docClient.send(
        new TransactWriteCommand({
          TransactItems: transactItems,
        }),
      );
    } else if (status === "rejected") {
      // Solo actualizar la orden como rechazada
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORDER#${externalReference}`,
            SK: "METADATA",
          },
          UpdateExpression:
            "SET payment_status = :rejected, updated_at = :updated",
          ExpressionAttributeValues: {
            ":rejected": "rejected",
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
            SK: `ORDER#${externalReference}`,
          },
          UpdateExpression: "SET payment_status = :rejected",
          ExpressionAttributeValues: {
            ":rejected": "rejected",
          },
        }),
      );
    } else {
      // Otros estados (pending, in_process, etc.)
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORDER#${externalReference}`,
            SK: "METADATA",
          },
          UpdateExpression:
            "SET payment_status = :status, updated_at = :updated",
          ExpressionAttributeValues: {
            ":status": status || "pending",
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
            SK: `ORDER#${externalReference}`,
          },
          UpdateExpression: "SET payment_status = :status",
          ExpressionAttributeValues: {
            ":status": status || "pending",
          },
        }),
      );
    }

    return success({ success: true });
  } catch (error) {
    console.error("Error en webhook:", error);
    // MercadoPago espera 200 incluso si hay error
    return success({
      success: false,
      error: error?.message || String(error),
    });
  }
};

export const webhook = webhookHandler;
