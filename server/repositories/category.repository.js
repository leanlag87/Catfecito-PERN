import { docClient, TABLE_NAME, getTimestamp } from "../dynamodb.js";
import {
  GetCommand,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

class CategoryRepository {
  //Buscar categoría por ID

  async findById(categoryId) {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${categoryId}`,
          SK: "METADATA",
        },
      }),
    );

    if (!result.Item) {
      return null;
    }

    return {
      id: categoryId,
      name: result.Item.name,
      description: result.Item.description,
      is_active: result.Item.is_active,
      created_at: result.Item.created_at,
      updated_at: result.Item.updated_at,
    };
  }

  async findByName(name) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :categoryType AND GSI2SK = :name",
        ExpressionAttributeValues: {
          ":categoryType": "CATEGORY",
          ":name": `NAME#${name.toLowerCase()}`,
        },
        Limit: 1,
      }),
    );

    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  }

  //Verificar si existe categoría por ID
  async existsById(categoryId) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `CATEGORY#${categoryId}`,
        },
        Limit: 1,
      }),
    );

    return result.Items && result.Items.length > 0;
  }

  async create(categoryData) {
    const { id, name, description } = categoryData;

    const category = {
      PK: `CATEGORY#${id}`,
      SK: "METADATA",
      GSI2PK: "CATEGORY",
      GSI2SK: `NAME#${name.toLowerCase()}`,
      entityType: "CATEGORY",
      id,
      name,
      description: description || null,
      is_active: true,
      created_at: getTimestamp(),
      updated_at: getTimestamp(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: category,
      }),
    );

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  }

  async update(categoryId, updateData) {
    const { name, description } = updateData;

    // Construir expresión de actualización dinámica
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = { ":updated_at": getTimestamp() };

    if (name !== undefined) {
      updateExpressions.push("#name = :name");
      updateExpressions.push("GSI2SK = :gsi2sk");
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = name;
      expressionAttributeValues[":gsi2sk"] = `NAME#${name.toLowerCase()}`;
    }

    if (description !== undefined) {
      updateExpressions.push("description = :description");
      expressionAttributeValues[":description"] = description;
    }

    updateExpressions.push("updated_at = :updated_at");

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${categoryId}`,
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
      is_active: result.Attributes.is_active,
      created_at: result.Attributes.created_at,
      updated_at: result.Attributes.updated_at,
    };
  }

  async toggleStatus(categoryId) {
    // Obtener estado actual
    const category = await this.findById(categoryId);

    if (!category) {
      return null;
    }

    const newStatus = !category.is_active;

    // Actualizar estado
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${categoryId}`,
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
      description: result.Attributes.description,
      is_active: result.Attributes.is_active,
      updated_at: result.Attributes.updated_at,
    };
  }

  // Contar productos asociados a una categoría
  async countProducts(categoryId) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :categoryPK",
        ExpressionAttributeValues: {
          ":categoryPK": `CATEGORY#${categoryId}`,
        },
        Select: "COUNT",
      }),
    );

    return result.Count || 0;
  }

  async delete(categoryId) {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${categoryId}`,
          SK: "METADATA",
        },
      }),
    );
  }

  async findAll() {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType AND is_active = :isActive",
        ExpressionAttributeValues: {
          ":entityType": "CATEGORY",
          ":isActive": true,
        },
      }),
    );

    // Ordenar por nombre (ascendente)
    return (result.Items || [])
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        is_active: c.is_active,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

export const categoryRepository = new CategoryRepository();
