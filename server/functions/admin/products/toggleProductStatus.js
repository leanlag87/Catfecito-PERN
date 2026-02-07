import { requireAdmin } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";
import { adminProductService } from "../../../services/admin/product.service.js";

const toggleProductStatusHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Delegar al servicio
    const updatedProduct = await adminProductService.toggleProductStatus(id);

    return success({
      success: true,
      message: `Producto ${updatedProduct.is_active ? "activado" : "desactivado"} exitosamente`,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error en toggleProductStatus:", error);

    if (error.name === "ProductNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al cambiar estado del producto");
  }
};

export const toggleProductStatus = requireAdmin(toggleProductStatusHandler);
