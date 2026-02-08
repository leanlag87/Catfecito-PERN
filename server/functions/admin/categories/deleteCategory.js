import { requireAdmin } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";
import { adminCategoryService } from "../../../services/admin/category.service.js";

const deleteCategoryHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Delegar al servicio
    const deletedCategory = await adminCategoryService.deleteCategory(id);

    return success({
      success: true,
      message: "Categoría eliminada exitosamente",
      category: deletedCategory,
    });
  } catch (error) {
    console.error("Error en deleteCategory:", error);

    if (error.name === "CategoryNotFoundError") {
      return notFound(error.message);
    }

    if (error.name === "CategoryHasProductsError") {
      return badRequest(error.message);
    }

    return serverError("Error al eliminar categoría");
  }
};

export const deleteCategory = requireAdmin(deleteCategoryHandler);
