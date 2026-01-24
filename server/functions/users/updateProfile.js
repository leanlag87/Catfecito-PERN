import { docClient, TABLE_NAME, getTimestamp } from "../../dynamodb.js";
import { UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../utils/auth.js";
import { parseBody } from "../../utils/validators.js";
import {
  success,
  conflict,
  badRequest,
  serverError,
} from "../../utils/responses.js";

const updateProfileHandler = async (event) => {
  try {
    const user = event.user;
    const body = parseBody(event);
    const { name, email } = body;

    // Validar que al menos un campo esté presente
    if (!name && !email) {
      return badRequest(
        "Debes proporcionar al menos un campo para actualizar (name o email)",
      );
    }

    // Si se está actualizando el email, verificar que no exista
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailCheck = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI1",
          KeyConditionExpression: "GSI1PK = :emailKey",
          ExpressionAttributeValues: {
            ":emailKey": `USER#EMAIL#${email.toLowerCase()}`,
          },
        }),
      );

      if (emailCheck.Items && emailCheck.Items.length > 0) {
        // Verificar que no sea el mismo usuario
        const existingUser = emailCheck.Items[0];
        if (existingUser.PK !== `USER#${user.id}`) {
          return conflict("El email ya está en uso");
        }
      }
    }

    // Expression para actualización dinámica
    let updateExpression = "SET updated_at = :updated_at";
    const expressionAttributeValues = {
      ":updated_at": getTimestamp(),
    };
    const expressionAttributeNames = {};

    if (name) {
      updateExpression += ", #name = :name";
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = name;
    }

    if (email) {
      updateExpression += ", email = :email, GSI1PK = :gsi1pk";
      expressionAttributeValues[":email"] = email.toLowerCase();
      expressionAttributeValues[":gsi1pk"] =
        `USER#EMAIL#${email.toLowerCase()}`;
    }

    // Actualizar usuario en DynamoDB
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${user.id}`,
          SK: "METADATA",
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ...(Object.keys(expressionAttributeNames).length > 0 && {
          ExpressionAttributeNames: expressionAttributeNames,
        }),
        ReturnValues: "ALL_NEW",
      }),
    );

    // Preparar datos del usuario actualizado
    const updatedUser = {
      id: user.id,
      name: result.Attributes.name,
      email: result.Attributes.email,
      role: result.Attributes.role,
      is_active: result.Attributes.is_active,
      created_at: result.Attributes.created_at,
      updated_at: result.Attributes.updated_at,
    };

    return success({
      success: true,
      message: "Perfil actualizado exitosamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error en updateProfile:", error);
    return serverError("Error al actualizar perfil");
  }
};

// Exportar con middleware de autenticación
export const updateProfile = requireAuth(updateProfileHandler);
