import { docClient, TABLE_NAME, getTimestamp } from "../dynamodb.js";
import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  BatchGetCommand,
  DeleteCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

class CartRepository {
  async findItem(userId, productId) {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `CART#${productId}`,
        },
      }),
    );

    return result.Item || null;
  }

  async createItem(userId, productId, productData, quantity) {
    const newItem = {
      PK: `USER#${userId}`,
      SK: `CART#${productId}`,
      GSI1PK: `PRODUCT#${productId}`,
      GSI1SK: `USER#${userId}`,
      entityType: "CART_ITEM",
      user_id: userId,
      product_id: productId,
      product_name: productData.name,
      product_price: productData.price,
      product_image: productData.image_url || null,
      quantity,
      created_at: getTimestamp(),
      updated_at: getTimestamp(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newItem,
      }),
    );

    return newItem;
  }

  async updateItemQuantity(userId, productId, newQuantity) {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `CART#${productId}`,
        },
        UpdateExpression: "SET quantity = :quantity, updated_at = :updatedAt",
        ExpressionAttributeValues: {
          ":quantity": newQuantity,
          ":updatedAt": getTimestamp(),
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    return result.Attributes;
  }

  //Obtener todos los items del carrito de un usuario
  async findAllByUser(userId) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": "CART#",
        },
      }),
    );

    return result.Items || [];
  }

  //Obtener productos en batch por sus IDs
  async findProductsBatch(productIds) {
    if (productIds.length === 0) {
      return [];
    }

    const productKeys = productIds.map((id) => ({
      PK: `PRODUCT#${id}`,
      SK: "METADATA",
    }));

    const result = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: productKeys,
          },
        },
      }),
    );

    return result.Responses[TABLE_NAME] || [];
  }

  async deleteItem(userId, productId) {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `CART#${productId}`,
        },
      }),
    );
  }

  //Obtener todas las keys del carrito, en este caso solo el PK y SK para eliminar en batch
  async findAllKeysByUser(userId) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": "CART#",
        },
        ProjectionExpression: "PK, SK",
      }),
    );

    return result.Items || [];
  }

  //Eliminar items en batch por sus keys
  async deleteBatch(items) {
    if (items.length === 0) {
      return 0;
    }

    const deleteRequests = items.map((item) => ({
      DeleteRequest: {
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      },
    }));

    // Dividir en batches de 25 (límite de DynamoDB)
    const batches = [];
    for (let i = 0; i < deleteRequests.length; i += 25) {
      batches.push(deleteRequests.slice(i, i + 25));
    }

    // Ejecutar batches
    for (const batch of batches) {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: batch,
          },
        }),
      );
    }

    return items.length;
  }
}

export const cartRepository = new CartRepository();
