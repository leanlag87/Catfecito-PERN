import { requireAdmin } from "../../../utils/auth.js";
import { parseMultipartFormData } from "../../../utils/multipart.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";
import { adminProductService } from "../../../services/admin/product.service.js";

const updateProductHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Parsear multipart form data
    const { fields, files } = await parseMultipartFormData(event);

    const imageFile = files.length > 0 ? files[0] : null;

    // Delegar al servicio
    const product = await adminProductService.updateProduct(
      id,
      fields,
      imageFile,
    );

    return success({
      success: true,
      message: "Producto actualizado exitosamente",
      product,
    });
  } catch (error) {
    console.error("Error en updateProduct:", error);

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    if (error.name === "ProductNotFoundError") {
      return notFound(error.message);
    }

    if (error.name === "CategoryNotFoundError") {
      return notFound(error.message);
    }

    if (error.name === "S3UploadError") {
      return serverError(error.message);
    }

    return serverError("Error al actualizar producto");
  }
};

export const updateProduct = requireAdmin(updateProductHandler);
