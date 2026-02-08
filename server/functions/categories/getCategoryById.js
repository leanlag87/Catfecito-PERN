import { success, notFound, serverError } from "../../utils/responses.js";
import { categoryService } from "../../services/category.service.js";

export const getCategoryById = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Delegar al servicio
    const category = await categoryService.getCategoryById(id);

    return success({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error en getCategoryById:", error);

    if (error.name === "CategoryNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al obtener categoría");
  }
};
