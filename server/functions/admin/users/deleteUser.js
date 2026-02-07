import { requireAdmin } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";
import { adminUserService } from "../../../services/admin/user.service.js";

const deleteUserHandler = async (event) => {
  try {
    const adminUser = event.user;
    const { id } = event.pathParameters;

    // Delegar al servicio
    const deletedUser = await adminUserService.deleteUser(adminUser.id, id);

    return success({
      success: true,
      message: "Usuario eliminado exitosamente",
      user: deletedUser,
    });
  } catch (error) {
    console.error("Error en deleteUser:", error);

    if (error.name === "SelfActionError") {
      return badRequest(error.message);
    }

    if (error.name === "UserNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al eliminar usuario");
  }
};

export const deleteUser = requireAdmin(deleteUserHandler);
