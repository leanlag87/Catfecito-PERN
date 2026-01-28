import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import { isNotEmpty } from "../../../utils/helpers.js";
import {
  success,
  badRequest,
  notFound,
  conflict,
  serverError,
} from "../../../utils/responses.js";

const updateCategoryHandler = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    const { name, description } = body;

    // Verificar que la categoría existe
    const currentCategoryResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!currentCategoryResult.Item) {
      return notFound("Categoría no encontrada");
    }

    const currentCategory = currentCategoryResult.Item;

    // Si se está actualizando el nombre, validar que no exista otro con ese nombre
    if (name && name.trim() !== currentCategory.name) {
      if (!isNotEmpty(name)) {
        return badRequest("El nombre no puede estar vacío");
      }

      const trimmedName = name.trim();

      // Verificar duplicados (case-insensitive)
      const existingCategory = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI2",
          KeyConditionExpression: "GSI2PK = :categoryType AND GSI2SK = :name",
          ExpressionAttributeValues: {
            ":categoryType": "CATEGORY",
            ":name": `NAME#${trimmedName.toLowerCase()}`,
          },
          Limit: 1,
        }),
      );

      // Si existe y no es la misma categoría
      if (
        existingCategory.Items &&
        existingCategory.Items.length > 0 &&
        existingCategory.Items[0].id !== id
      ) {
        return conflict("Ya existe una categoría con ese nombre");
      }
    }

    // Preparar expresiones de actualización
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (name && name.trim() !== currentCategory.name) {
      const trimmedName = name.trim();
      updateExpressions.push("#name = :name");
      updateExpressions.push("GSI2SK = :gsi2sk");
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = trimmedName;
      expressionAttributeValues[":gsi2sk"] =
        `NAME#${trimmedName.toLowerCase()}`;
    }

    if (
      description !== undefined &&
      description !== currentCategory.description
    ) {
      updateExpressions.push("description = :description");
      expressionAttributeValues[":description"] = description?.trim() || null;
    }

    // Si no hay cambios
    if (updateExpressions.length === 0) {
      return success({
        success: true,
        message: "No hay cambios para actualizar",
        category: {
          id: currentCategory.id,
          name: currentCategory.name,
          description: currentCategory.description,
          is_active: currentCategory.is_active,
          created_at: currentCategory.created_at,
          updated_at: currentCategory.updated_at,
        },
      });
    }

    // Siempre actualizar updated_at
    updateExpressions.push("updated_at = :updated_at");
    expressionAttributeValues[":updated_at"] = getTimestamp();

    // Actualizar categoría en DynamoDB
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${id}`,
          SK: "METADATA",
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return success({
      success: true,
      message: "Categoría actualizada exitosamente",
      category: {
        id: result.Attributes.id,
        name: result.Attributes.name,
        description: result.Attributes.description,
        is_active: result.Attributes.is_active,
        created_at: result.Attributes.created_at,
        updated_at: result.Attributes.updated_at,
      },
    });
  } catch (error) {
    console.error("❌ Error en updateCategory:", error);
    return serverError("Error al actualizar categoría");
  }
};

export const updateCategory = requireAdmin(updateCategoryHandler);
