import { requireAdmin } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";
import { adminUserService } from "../../../services/admin/user.service.js";

const toggleUserStatusHandler = async (event) => {
  try {
    const adminUser = event.user;
    const { id } = event.pathParameters;

    // Delegar al servicio
    const updatedUser = await adminUserService.toggleUserStatus(
      adminUser.id,
      id,
    );

    return success({
      success: true,
      message: `Usuario ${updatedUser.is_active ? "activado" : "desactivado"} exitosamente`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error en toggleUserStatus:", error);

    if (error.name === "SelfActionError") {
      return badRequest(error.message);
    }

    if (error.name === "UserNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al cambiar estado");
  }
};

export const toggleUserStatus = requireAdmin(toggleUserStatusHandler);
