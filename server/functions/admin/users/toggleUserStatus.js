import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";

const toggleUserStatusHandler = async (event) => {
  try {
    const adminUser = event.user;
    const { id } = event.pathParameters;

    // Evitar que el admin se desactive a sí mismo
    if (adminUser.id === id) {
      return badRequest("No puedes desactivar tu propia cuenta");
    }

    // Primero obtener el estado actual del usuario
    const getUserResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!getUserResult.Item) {
      return notFound("Usuario no encontrado");
    }

    const currentStatus = getUserResult.Item.is_active;
    const newStatus = !currentStatus;

    // Actualizar el estado del usuario
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${id}`,
          SK: "METADATA",
        },
        UpdateExpression:
          "SET is_active = :newStatus, updated_at = :updated_at",
        ExpressionAttributeValues: {
          ":newStatus": newStatus,
          ":updated_at": getTimestamp(),
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    const updatedUser = {
      id: id,
      name: result.Attributes.name,
      email: result.Attributes.email,
      role: result.Attributes.role,
      is_active: result.Attributes.is_active,
    };

    return success({
      success: true,
      message: `Usuario ${newStatus ? "activado" : "desactivado"} exitosamente`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error en toggleUserStatus:", error);
    return serverError("Error al cambiar estado");
  }
};

export const toggleUserStatus = requireAdmin(toggleUserStatusHandler);
