import { requireAdmin } from "../../../utils/auth.js";
import { parseMultipartFormData } from "../../../utils/multipart.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";
import { adminProductService } from "../../../services/admin/product.service.js";

const createProductHandler = async (event) => {
  try {
    // Parsear multipart form data
    const { fields, files } = await parseMultipartFormData(event);

    const imageFile = files.length > 0 ? files[0] : null;

    // Delegar al servicio
    const product = await adminProductService.createProduct(fields, imageFile);

    return success(
      {
        success: true,
        message: "Producto creado exitosamente",
        product,
      },
      201,
    );
  } catch (error) {
    console.error("Error en createProduct:", error);

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    if (error.name === "CategoryNotFoundError") {
      return notFound(error.message);
    }

    if (error.name === "S3UploadError") {
      return serverError(error.message);
    }

    return serverError("Error al crear producto");
  }
};

export const createProduct = requireAdmin(createProductHandler);
