import { success, notFound, serverError } from "../../utils/responses.js";
import { productService } from "../../services/product.service.js";

export const getProductById = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Delegar al servicio
    const product = await productService.getProductById(id);

    return success({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error en getProductById:", error);

    if (error.name === "ProductNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al obtener producto");
  }
};
