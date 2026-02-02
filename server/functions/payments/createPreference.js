import { docClient, TABLE_NAME, getTimestamp } from "../../dynamodb.js";
import {
  GetCommand,
  QueryCommand,
  UpdateCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";
import { preference } from "../../libs/mercadopago.js";
import { requireAuth } from "../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../utils/responses.js";

const createPreferenceHandler = async (event) => {
  try {
    const userId = event.user.id;
    const userName = event.user.name;
    const userEmail = event.user.email;
    const body = JSON.parse(event.body);
    const { order_id } = body;

    // Construir URL del backend desde el evento de API Gateway
    const domain = event.requestContext?.domainName;
    const stage = event.requestContext?.stage || "";
    const backendUrl = `https://${domain}${stage ? "/" + stage : ""}`;

    console.log("💳 Creating payment preference:", {
      userId,
      order_id,
      backendUrl,
      webhook: `${backendUrl}/api/payments/webhook`,
    });

    // Validación
    if (!order_id) {
      return badRequest("El order_id es requerido");
    }

    // Verificar que la orden existe y pertenece al usuario
    const orderIndexResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `ORDER#${order_id}`,
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
          PK: `ORDER#${order_id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!orderResult.Item) {
      return notFound("Orden no encontrada");
    }

    const order = orderResult.Item;

    //  Verificar que la orden no esté ya pagada
    if (order.payment_status === "approved" || order.status === "paid") {
      return badRequest("Esta orden ya ha sido pagada");
    }

    //  Obtener items de la orden
    const itemsResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `ORDER#${order_id}`,
          ":sk": "ITEM#",
        },
      }),
    );

    if (!itemsResult.Items || itemsResult.Items.length === 0) {
      return badRequest("La orden no tiene ítems");
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

    // Preparar items para MercadoPago
    const CURRENCY_ID = process.env.CURRENCY_ID || "ARS";

    const items = itemsResult.Items.map((item) => {
      const product = productsMap[item.product_id];
      return {
        id: item.product_id,
        title: product?.name || "Producto",
        description: product?.description || "Producto de Catfecito",
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
        currency_id: CURRENCY_ID,
      };
    });

    const preferenceData = {
      items: items,
      payer: {
        name: userName,
        email: userEmail,
      },
      external_reference: order_id.toString(),
      notification_url: `${backendUrl}/api/payments/webhook`,
      statement_descriptor: "CATFECITO",
      metadata: {
        order_id: order_id,
        user_id: userId,
      },
    };

    console.log(
      "🔵 Enviando preferencia a MercadoPago:",
      JSON.stringify(preferenceData, null, 2),
    );

    // Crear preferencia en MercadoPago
    const result = await preference.create({ body: preferenceData });

    console.log(
      "✅ Respuesta de MercadoPago:",
      JSON.stringify(result, null, 2),
    );

    // SDK puede devolver distintas formas según versión
    const prefId = result?.id || result?.body?.id;
    const initPoint = result?.init_point || result?.body?.init_point;
    const sandboxInitPoint =
      result?.sandbox_init_point || result?.body?.sandbox_init_point;

    if (!prefId) {
      throw new Error("No se obtuvo 'id' de la preferencia de MercadoPago");
    }

    // Guardar payment_id (preference_id) en la orden
    const timestamp = getTimestamp();

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORDER#${order_id}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET payment_id = :payment_id, updated_at = :updated",
        ExpressionAttributeValues: {
          ":payment_id": prefId,
          ":updated": timestamp,
        },
      }),
    );

    console.log(`✅ Preferencia creada: ${prefId} para orden ${order_id}`);

    // Devolver link de pago
    return success({
      success: true,
      message: "Preferencia de pago creada exitosamente",
      preference_id: prefId,
      init_point: initPoint,
      sandbox_init_point: sandboxInitPoint,
      order_id: order_id,
      total: order.total,
    });
  } catch (error) {
    console.error("Error en createPreference:");
    console.error("Message:", error?.message);
    console.error(
      "Response data:",
      JSON.stringify(error?.response?.data, null, 2),
    );
    console.error("Stack:", error?.stack);

    return serverError("Error al crear preferencia de pago", {
      error: error?.response?.data || error?.message,
      details: error?.cause?.message || error?.cause,
    });
  }
};

export const createPreference = requireAuth(createPreferenceHandler);
