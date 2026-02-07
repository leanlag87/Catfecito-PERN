import { v4 as uuidv4 } from "uuid";
import { productRepository } from "../../repositories/product.repository.js";
import { categoryRepository } from "../../repositories/category.repository.js";
import { uploadToS3 } from "../../utils/s3.js";

class AdminProductService {
  //Crear producto

  async createProduct(productData, imageFile) {
    const { name, description, price, stock, category_id } = productData;

    // Validaciones
    if (!name || !description || !price || !category_id) {
      const error = new Error(
        "Nombre, descripción, precio y categoría son requeridos",
      );
      error.name = "ValidationError";
      throw error;
    }

    if (parseFloat(price) < 0) {
      const error = new Error("El precio debe ser positivo");
      error.name = "ValidationError";
      throw error;
    }

    if (stock && parseInt(stock) < 0) {
      const error = new Error("El stock debe ser positivo");
      error.name = "ValidationError";
      throw error;
    }

    // Verificar que la categoría existe
    const category = await categoryRepository.findById(category_id);

    if (!category) {
      const error = new Error("Categoría no encontrada");
      error.name = "CategoryNotFoundError";
      throw error;
    }

    // Procesar imagen si está presente
    let image_url = null;

    if (imageFile) {
      try {
        const productId = uuidv4();
        const imageKey = `products/${productId}/${imageFile.filename}`;
        image_url = await uploadToS3(
          imageFile.buffer,
          imageKey,
          imageFile.mimeType,
        );
      } catch (uploadError) {
        console.error("Error uploading image to S3:", uploadError);
        const error = new Error("Error al subir la imagen");
        error.name = "S3UploadError";
        throw error;
      }
    }

    // Crear producto
    const product = await productRepository.create({
      name,
      description,
      price,
      stock,
      category_id,
      category_name: category.name,
      image_url,
    });

    return product;
  }
}

export const adminProductService = new AdminProductService();
