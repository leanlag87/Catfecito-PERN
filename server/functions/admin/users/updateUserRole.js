import { requireAdmin } from "../../../utils/auth.js";
import { parseBody } from "../../../utils/validators.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";
import { adminUserService } from "../../../services/admin/user.service.js";

const updateUserRoleHandler = async (event) => {
  try {
    const adminUser = event.user;
    const { id } = event.pathParameters;
    const body = parseBody(event);
    const { role } = body;

    // Delegar al servicio
    const updatedUser = await adminUserService.updateUserRole(
      adminUser.id,
      id,
      role,
    );

    return success({
      success: true,
      message: "Rol actualizado exitosamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error en updateUserRole:", error);

    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    if (error.name === "LastAdminError") {
      return badRequest(error.message);
    }

    if (error.name === "UserNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al actualizar rol");
  }
};

export const updateUserRole = requireAdmin(updateUserRoleHandler);
