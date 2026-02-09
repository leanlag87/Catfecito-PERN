import { docClient, TABLE_NAME, getTimestamp } from "../dynamodb.js";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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
}

export const cartRepository = new CartRepository();
