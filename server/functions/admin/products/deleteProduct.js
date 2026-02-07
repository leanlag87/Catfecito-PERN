import { requireAdmin } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";
import { adminProductService } from "../../../services/admin/product.service.js";

const deleteProductHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Delegar al servicio
    const result = await adminProductService.deleteProduct(id);

    return success({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error en deleteProduct:", error);

    if (error.name === "ProductNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al eliminar producto");
  }
};

export const deleteProduct = requireAdmin(deleteProductHandler);
