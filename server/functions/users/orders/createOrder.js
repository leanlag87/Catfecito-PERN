import { v4 as uuidv4 } from "uuid";
import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import {
  QueryCommand,
  BatchGetCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../../utils/auth.js";
import { success, badRequest, serverError } from "../../../utils/responses.js";

const createOrderHandler = async (event) => {
  try {
    const userId = event.user.id;
    const body = JSON.parse(event.body);

    const {
      shipping_first_name,
      shipping_last_name,
      shipping_country,
      shipping_address,
      shipping_address2,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_phone,
    } = body;

    // Validación de campos requeridos
    if (
      !shipping_first_name ||
      !shipping_last_name ||
      !shipping_country ||
      !shipping_address ||
      !shipping_city ||
      !shipping_state ||
      !shipping_zip
    ) {
      return badRequest(
        "Todos los campos de dirección son requeridos (excepto address2 y phone)",
      );
    }

    // Obtener items del carrito
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
      return badRequest("El carrito está vacío");
    }

    // Obtener información de productos en batch
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
    const productsMap = {};
    products.forEach((product) => {
      const productId = product.PK.replace("PRODUCT#", "");
      productsMap[productId] = product;
    });

    // Validar stock y productos activos
    for (const cartItem of cartResult.Items) {
      const product = productsMap[cartItem.product_id];

      if (!product) {
        return badRequest(`Producto no encontrado: ${cartItem.product_id}`);
      }

      if (!product.is_active) {
        return badRequest(
          `El producto "${product.name}" ya no está disponible`,
        );
      }

      if (product.stock < cartItem.quantity) {
        return badRequest(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`,
        );
      }
    }

    // Calcular total
    let total = 0;
    const orderItems = cartResult.Items.map((cartItem) => {
      const product = productsMap[cartItem.product_id];
      const subtotal = parseFloat(product.price) * parseInt(cartItem.quantity);
      total += subtotal;

      return {
        product_id: cartItem.product_id,
        product_name: product.name,
        quantity: cartItem.quantity,
        price: product.price,
        subtotal: subtotal.toFixed(2),
        image_url: product.image_url,
      };
    });

    // Crear orden con TransactWrite
    const orderId = uuidv4();
    const timestamp = getTimestamp();

    const transactItems = [];

    // Crear ORDER METADATA
    transactItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          PK: `ORDER#${orderId}`,
          SK: "METADATA",
          user_id: userId,
          total: total.toFixed(2),
          status: "pending",
          payment_status: "pending",
          shipping_first_name,
          shipping_last_name,
          shipping_country,
          shipping_address,
          shipping_address2: shipping_address2 || null,
          shipping_city,
          shipping_state,
          shipping_zip,
          shipping_phone: shipping_phone || null,
          created_at: timestamp,
          updated_at: timestamp,
        },
      },
    });

    // Crear índice USER#ORDER (para buscar órdenes por usuario)
    transactItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `ORDER#${orderId}`,
          order_id: orderId,
          total: total.toFixed(2),
          status: "pending",
          payment_status: "pending",
          created_at: timestamp,
        },
      },
    });

    // Crear ORDER ITEMS
    orderItems.forEach((item) => {
      transactItems.push({
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `ORDER#${orderId}`,
            SK: `ITEM#${item.product_id}`,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            created_at: timestamp,
          },
        },
      });
    });

    // Eliminar items del carrito
    cartResult.Items.forEach((cartItem) => {
      transactItems.push({
        Delete: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: `CART#${cartItem.product_id}`,
          },
        },
      });
    });

    // Ejecutar transacción (todo o nada)
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      }),
    );

    // Retornar orden completa
    return success(
      {
        success: true,
        message: "Orden creada exitosamente",
        order: {
          id: orderId,
          user_id: userId,
          total: total.toFixed(2),
          status: "pending",
          payment_status: "pending",
          shipping_first_name,
          shipping_last_name,
          shipping_country,
          shipping_address,
          shipping_address2: shipping_address2 || null,
          shipping_city,
          shipping_state,
          shipping_zip,
          shipping_phone: shipping_phone || null,
          created_at: timestamp,
          updated_at: timestamp,
          items: orderItems,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Error en createOrder:", error);
    return serverError("Error al crear la orden");
  }
};

export const createOrder = requireAuth(createOrderHandler);
