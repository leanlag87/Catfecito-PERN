import { v4 as uuidv4 } from "uuid";
import { docClient, TABLE_NAME, getTimestamp } from "../dynamodb.js";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

class ProductRepository {
  // Crear producto

  async create(productData) {
    const productId = uuidv4();
    const {
      name,
      description,
      price,
      stock,
      category_id,
      category_name,
      image_url,
    } = productData;

    const product = {
      PK: `PRODUCT#${productId}`,
      SK: "METADATA",
      GSI1PK: `CATEGORY#${category_id}`,
      GSI1SK: `PRODUCT#${productId}`,
      entityType: "PRODUCT",
      id: productId,
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      category_id,
      category_name,
      image_url,
      is_active: true,
      created_at: getTimestamp(),
      updated_at: getTimestamp(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: product,
      }),
    );

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      category_name: product.category_name,
      image_url: product.image_url,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  }

  // Buscar producto por ID

  async findById(productId) {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${productId}`,
          SK: "METADATA",
        },
      }),
    );

    return result.Item || null;
  }
}

export const productRepository = new ProductRepository();
