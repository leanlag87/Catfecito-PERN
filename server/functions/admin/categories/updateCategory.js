import { requireAdmin } from "../../../utils/auth.js";
import { parseBody } from "../../../utils/validators.js";
import {
  success,
  badRequest,
  notFound,
  conflict,
  serverError,
} from "../../../utils/responses.js";
import { adminCategoryService } from "../../../services/admin/category.service.js";

const updateCategoryHandler = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = parseBody(event);
    const { name, description } = body;

    // Delegar al servicio
    const category = await adminCategoryService.updateCategory(id, {
      name,
      description,
    });

    return success({
      success: true,
      message: "Categoría actualizada exitosamente",
      category,
    });
  } catch (error) {
    console.error("Error en updateCategory:", error);

    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    if (error.name === "CategoryNotFoundError") {
      return notFound(error.message);
    }

    if (error.name === "CategoryExistsError") {
      return conflict(error.message);
    }

    return serverError("Error al actualizar categoría");
  }
};

export const updateCategory = requireAdmin(updateCategoryHandler);
