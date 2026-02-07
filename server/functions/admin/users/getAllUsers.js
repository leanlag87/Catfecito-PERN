import { requireAdmin } from "../../../utils/auth.js";
import { success, serverError } from "../../../utils/responses.js";
import { adminUserService } from "../../../services/admin/user.service.js";

const getAllUsersHandler = async (event) => {
  try {
    // Delegar al servicio
    const result = await adminUserService.getAllUsers();

    return success({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error en getAllUsers:", error);
    return serverError("Error al obtener usuarios");
  }
};

export const getAllUsers = requireAdmin(getAllUsersHandler);
