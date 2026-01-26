import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import { generateSlug, isNotEmpty } from "../../../utils/helpers.js";
import {
  success,
  badRequest,
  conflict,
  serverError,
} from "../../../utils/responses.js";

const createCategoryHandler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { name, description } = body;

    // Validamos si el nombre está vacío
    if (!isNotEmpty(name)) {
      return badRequest("El nombre es requerido");
    }

    const trimmedName = name.trim();

    // Verificar si ya existe una categoría con ese nombre (case-insensitive)
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

    if (existingCategory.Items && existingCategory.Items.length > 0) {
      return conflict("Ya existe una categoría con ese nombre");
    }

    // Generar ID único basado en el nombre (slug)
    const categoryId = generateSlug(trimmedName);

    // Verificar que el ID no exista (por si acaso dos nombres generan el mismo slug)
    const existingById = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `CATEGORY#${categoryId}`,
        },
        Limit: 1,
      }),
    );

    // Si el ID ya existe, agregar timestamp
    const finalId =
      existingById.Items && existingById.Items.length > 0
        ? `${categoryId}-${Date.now()}`
        : categoryId;

    const category = {
      PK: `CATEGORY#${finalId}`,
      SK: "METADATA",
      GSI2PK: "CATEGORY",
      GSI2SK: `NAME#${trimmedName.toLowerCase()}`,
      entityType: "CATEGORY",
      id: finalId,
      name: trimmedName,
      description: description?.trim() || null,
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

    return success(
      {
        success: true,
        message: "Categoría creada exitosamente",
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
          is_active: category.is_active,
          created_at: category.created_at,
          updated_at: category.updated_at,
        },
      },
      201,
    );
  } catch (error) {
    console.error("❌ Error en createCategory:", error);
    return serverError("Error al crear categoría");
  }
};

export const createCategory = requireAdmin(createCategoryHandler);
