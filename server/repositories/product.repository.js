import { v4 as uuidv4 } from "uuid";
import { docClient, TABLE_NAME, getTimestamp } from "../dynamodb.js";
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

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

  async update(productId, updateData) {
    const {
      name,
      description,
      price,
      stock,
      category_id,
      category_name,
      image_url,
    } = updateData;

    // Construir expresión de actualización
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = { ":updated_at": getTimestamp() };

    if (name !== undefined) {
      updateExpressions.push("#name = :name");
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = name;
    }

    if (description !== undefined) {
      updateExpressions.push("description = :description");
      expressionAttributeValues[":description"] = description;
    }

    if (price !== undefined) {
      updateExpressions.push("price = :price");
      expressionAttributeValues[":price"] = parseFloat(price);
    }

    if (stock !== undefined) {
      updateExpressions.push("stock = :stock");
      expressionAttributeValues[":stock"] = parseInt(stock);
    }

    if (category_id !== undefined) {
      updateExpressions.push("category_id = :category_id");
      updateExpressions.push("category_name = :category_name");
      updateExpressions.push("GSI1PK = :gsi1pk");
      expressionAttributeValues[":category_id"] = category_id;
      expressionAttributeValues[":category_name"] = category_name;
      expressionAttributeValues[":gsi1pk"] = `CATEGORY#${category_id}`;
    }

    if (image_url !== undefined) {
      updateExpressions.push("image_url = :image_url");
      expressionAttributeValues[":image_url"] = image_url;
    }

    updateExpressions.push("updated_at = :updated_at");

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${productId}`,
          SK: "METADATA",
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ...(Object.keys(expressionAttributeNames).length > 0 && {
          ExpressionAttributeNames: expressionAttributeNames,
        }),
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return {
      id: result.Attributes.id,
      name: result.Attributes.name,
      description: result.Attributes.description,
      price: result.Attributes.price,
      stock: result.Attributes.stock,
      category_id: result.Attributes.category_id,
      category_name: result.Attributes.category_name,
      image_url: result.Attributes.image_url,
      is_active: result.Attributes.is_active,
      created_at: result.Attributes.created_at,
      updated_at: result.Attributes.updated_at,
    };
  }

  async hasOrderReferences(productId) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :productPK",
        ExpressionAttributeValues: {
          ":productPK": `PRODUCT#${productId}`,
        },
        ProjectionExpression: "PK, SK",
        Limit: 1, // Solo necesitamos saber si existe al menos uno
      }),
    );

    return result.Items && result.Items.length > 0;
  }

  // Desactivar producto
  async softDelete(productId) {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${productId}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET is_active = :isActive, updated_at = :updatedAt",
        ExpressionAttributeValues: {
          ":isActive": false,
          ":updatedAt": getTimestamp(),
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    return {
      id: result.Attributes.id,
      name: result.Attributes.name,
      is_active: result.Attributes.is_active,
    };
  }

  // Eliminar producto de DynamoDB
  async delete(productId) {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${productId}`,
          SK: "METADATA",
        },
      }),
    );
  }

  async toggleStatus(productId) {
    // Obtener estado actual
    const product = await this.findById(productId);

    if (!product) {
      return null;
    }

    const newStatus = !product.is_active;

    // Actualizar estado
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${productId}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET is_active = :isActive, updated_at = :updatedAt",
        ExpressionAttributeValues: {
          ":isActive": newStatus,
          ":updatedAt": getTimestamp(),
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    return {
      id: result.Attributes.id,
      name: result.Attributes.name,
      is_active: result.Attributes.is_active,
      updated_at: result.Attributes.updated_at,
    };
  }

  // Obtener todos los productos activos
  async findAll() {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType AND is_active = :isActive",
        ExpressionAttributeValues: {
          ":entityType": "PRODUCT",
          ":isActive": true,
        },
      }),
    );

    // Ordenar por fecha de creación (más recientes primero)
    return (result.Items || [])
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        image_url: p.image_url,
        is_active: p.is_active,
        created_at: p.created_at,
        updated_at: p.updated_at,
        category_id: p.category_id,
        category_name: p.category_name,
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async findByCategory(categoryId) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :categoryPK",
        FilterExpression: "is_active = :isActive",
        ExpressionAttributeValues: {
          ":categoryPK": `CATEGORY#${categoryId}`,
          ":isActive": true,
        },
      }),
    );

    // Ordenar por fecha de creación (más recientes primero)
    return (result.Items || [])
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        image_url: p.image_url,
        is_active: p.is_active,
        created_at: p.created_at,
        updated_at: p.updated_at,
        category_id: p.category_id,
        category_name: p.category_name,
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export const productRepository = new ProductRepository();
