import { requireAdmin } from "../../../utils/auth.js";
import { parseBody } from "../../../utils/validators.js";
import {
  success,
  badRequest,
  conflict,
  serverError,
} from "../../../utils/responses.js";
import { adminCategoryService } from "../../../services/admin/category.service.js";

const createCategoryHandler = async (event) => {
  try {
    const body = parseBody(event);
    const { name, description } = body;

    // Delegar al servicio
    const category = await adminCategoryService.createCategory({
      name,
      description,
    });

    return success(
      {
        success: true,
        message: "Categoría creada exitosamente",
        category,
      },
      201,
    );
  } catch (error) {
    console.error("Error en createCategory:", error);

    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    if (error.name === "CategoryExistsError") {
      return conflict(error.message);
    }

    return serverError("Error al crear categoría");
  }
};

export const createCategory = requireAdmin(createCategoryHandler);
