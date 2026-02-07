import { requireAdmin } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";
import { adminUserService } from "../../../services/admin/user.service.js";

const getUserByIdHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Delegar al servicio
    const user = await adminUserService.getUserById(id);

    return success({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error en getUserById:", error);

    if (error.name === "UserNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al obtener usuario");
  }
};

export const getUserById = requireAdmin(getUserByIdHandler);
