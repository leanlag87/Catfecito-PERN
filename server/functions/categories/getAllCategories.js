import { success, serverError } from "../../utils/responses.js";
import { categoryService } from "../../services/category.service.js";

export const getAllCategories = async (event) => {
  try {
    // Delegar al servicio
    const result = await categoryService.getAllCategories();

    return success({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error en getAllCategories:", error);
    return serverError("Error al obtener categorías");
  }
};
