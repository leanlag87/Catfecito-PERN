import { success, serverError } from "../../utils/responses.js";
import { productService } from "../../services/product.service.js";

export const getProductsByCategory = async (event) => {
  try {
    const { categoryId } = event.pathParameters;

    // Delegar al servicio
    const result = await productService.getProductsByCategory(categoryId);

    return success({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error en getProductsByCategory:", error);
    return serverError("Error al obtener productos por categoría");
  }
};
