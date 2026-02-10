import { v4 as uuidv4 } from "uuid";
import { docClient, TABLE_NAME, getTimestamp } from "../dynamodb.js";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

class OrderRepository {
  /**
   * Crear orden con items usando transacción atómica
   * transacción atómica se refiere a la capacidad de ejecutar múltiples operaciones de base de datos como una sola unidad de trabajo.
   * Si alguna de las operaciones falla, toda la transacción se revierte
   * asegurando la integridad de los datos. En el contexto de crear una orden
   * esto es crucial para garantizar que no se creen órdenes incompletas o inconsistentes,
   * especialmente cuando se involucran múltiples tablas o registros relacionados
   * (como metadata de la orden y items de la orden).
   */
  async createWithTransaction(userId, orderData, cartItems) {
    const orderId = uuidv4();
    const timestamp = getTimestamp();
    const {
      total,
      orderItems,
      shipping_first_name,
      shipping_last_name,
      shipping_country,
      shipping_address,
      shipping_address2,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_phone,
    } = orderData;

    const transactItems = [];

    // Crear ORDER METADATA
    transactItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          PK: `ORDER#${orderId}`,
          SK: "METADATA",
          entityType: "ORDER",
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
        },
      },
    });

    //  Crear índice USER#ORDER (GSI para buscar órdenes por usuario)
    transactItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `ORDER#${orderId}`,
          GSI1PK: `ORDER#${orderId}`,
          GSI1SK: "METADATA",
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
            entityType: "ORDER_ITEM",
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            image_url: item.image_url,
            created_at: timestamp,
          },
        },
      });
    });

    // Eliminar items del carrito
    cartItems.forEach((cartItem) => {
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

    // Ejecutar transacción
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      }),
    );

    return {
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
    };
  }

  //Obtener indice de ordenes del usuario
  async countOrderItems(orderId) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `ORDER#${orderId}`,
          ":sk": "ITEM#",
        },
        Select: "COUNT",
      }),
    );

    return result.Count || 0;
  }
}

export const orderRepository = new OrderRepository();
