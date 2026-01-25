import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import { parseBody } from "../../../utils/validators.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";

const updateUserRoleHandler = async (event) => {
  try {
    const adminUser = event.user;
    const { id } = event.pathParameters;
    const body = parseBody(event);
    const { role } = body;

    // Validar rol
    if (!["user", "admin"].includes(role)) {
      return badRequest("Rol inválido. Debe ser 'user' o 'admin'");
    }

    // Evitar que el único admin se quite su propio rol
    if (role === "user" && adminUser.id === id) {
      const scanResult = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: "#role = :adminRole AND SK = :metadata",
          ExpressionAttributeNames: {
            "#role": "role",
          },
          ExpressionAttributeValues: {
            ":adminRole": "admin",
            ":metadata": "METADATA",
          },
        }),
      );

      if (scanResult.Items.length === 1) {
        return badRequest(
          "No puedes quitar el rol de admin al único administrador",
        );
      }
    }

    // Actualizar rol del usuario
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${id}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET #role = :role, updated_at = :updated_at",
        ExpressionAttributeNames: {
          "#role": "role",
        },
        ExpressionAttributeValues: {
          ":role": role,
          ":updated_at": getTimestamp(),
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    if (!result.Attributes) {
      return notFound("Usuario no encontrado");
    }

    const updatedUser = {
      id: id,
      name: result.Attributes.name,
      email: result.Attributes.email,
      role: result.Attributes.role,
      is_active: result.Attributes.is_active,
    };

    return success({
      success: true,
      message: "Rol actualizado exitosamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error en updateUserRole:", error);
    return serverError("Error al actualizar rol");
  }
};

export const updateUserRole = requireAdmin(updateUserRoleHandler);
