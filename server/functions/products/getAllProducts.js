import { success, serverError } from "../../utils/responses.js";
import { productService } from "../../services/product.service.js";

export const getAllProducts = async (event) => {
  try {
    // Delegar al servicio
    const result = await productService.getAllProducts();

    return success({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error en getAllProducts:", error);
    return serverError("Error al obtener productos");
  }
};
