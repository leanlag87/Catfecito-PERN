import { requireAdmin } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";
import { adminCategoryService } from "../../../services/admin/category.service.js";

const toggleCategoryStatusHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Delegar al servicio
    const updatedCategory = await adminCategoryService.toggleCategoryStatus(id);

    return success({
      success: true,
      message: `Categoría ${updatedCategory.is_active ? "activada" : "desactivada"} exitosamente`,
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error en toggleCategoryStatus:", error);

    if (error.name === "CategoryNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al cambiar estado de la categoría");
  }
};

export const toggleCategoryStatus = requireAdmin(toggleCategoryStatusHandler);
