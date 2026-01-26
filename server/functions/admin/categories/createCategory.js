import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  conflict,
  serverError,
} from "../../../utils/responses.js";

// Helper para generar ID slug desde nombre
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-z0-9]+/g, "-") // Reemplazar espacios y caracteres especiales con guiones
    .replace(/^-+|-+$/g, ""); // Eliminar guiones al inicio y final
};

const createCategoryHandler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { name, description, image_url } = body;

    console.log("📝 Creating category:", { name, description });

    // Validación
    if (!name || name.trim() === "") {
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

    if (existingById.Items && existingById.Items.length > 0) {
      // Si existe, agregar timestamp al ID
      const timestamp = Date.now();
      const uniqueId = `${categoryId}-${timestamp}`;

      const category = {
        PK: `CATEGORY#${uniqueId}`,
        SK: "METADATA",
        GSI2PK: "CATEGORY",
        GSI2SK: `NAME#${trimmedName.toLowerCase()}`,
        entityType: "CATEGORY",
        id: uniqueId,
        name: trimmedName,
        description: description?.trim() || null,
        image_url: image_url || null,
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

      console.log("✅ Category created successfully:", uniqueId);

      return success(
        {
          success: true,
          message: "Categoría creada exitosamente",
          category: {
            id: category.id,
            name: category.name,
            description: category.description,
            image_url: category.image_url,
            is_active: category.is_active,
            created_at: category.created_at,
            updated_at: category.updated_at,
          },
        },
        201,
      );
    }

    // Crear categoría en DynamoDB
    const category = {
      PK: `CATEGORY#${categoryId}`,
      SK: "METADATA",
      GSI2PK: "CATEGORY",
      GSI2SK: `NAME#${trimmedName.toLowerCase()}`,
      entityType: "CATEGORY",
      id: categoryId,
      name: trimmedName,
      description: description?.trim() || null,
      image_url: image_url || null,
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

    console.log("✅ Category created successfully:", categoryId);

    return success(
      {
        success: true,
        message: "Categoría creada exitosamente",
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
          image_url: category.image_url,
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
