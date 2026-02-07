import { v4 as uuidv4 } from "uuid";
import { productRepository } from "../../repositories/product.repository.js";
import { categoryRepository } from "../../repositories/category.repository.js";
import { uploadToS3, deleteFromS3, getS3KeyFromUrl } from "../../utils/s3.js";

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

  async updateProduct(productId, updateData, imageFile) {
    const { name, description, price, stock, category_id } = updateData;

    // Validaciones
    if (price !== undefined && parseFloat(price) < 0) {
      const error = new Error("El precio debe ser positivo");
      error.name = "ValidationError";
      throw error;
    }

    if (stock !== undefined && parseInt(stock) < 0) {
      const error = new Error("El stock debe ser positivo");
      error.name = "ValidationError";
      throw error;
    }

    // Obtener producto actual
    const currentProduct = await productRepository.findById(productId);

    if (!currentProduct) {
      const error = new Error("Producto no encontrado");
      error.name = "ProductNotFoundError";
      throw error;
    }

    let image_url = currentProduct.image_url;
    let category_name = currentProduct.category_name;

    // Verificar categoría si se está actualizando
    if (category_id && category_id !== currentProduct.category_id) {
      const category = await categoryRepository.findById(category_id);

      if (!category) {
        const error = new Error("Categoría no encontrada");
        error.name = "CategoryNotFoundError";
        throw error;
      }

      category_name = category.name;
    }

    // Procesar nueva imagen si está presente
    if (imageFile) {
      try {
        // Eliminar imagen anterior de S3 si existe
        if (currentProduct.image_url) {
          const oldImageKey = getS3KeyFromUrl(currentProduct.image_url);
          if (oldImageKey) {
            await deleteFromS3(oldImageKey);
          }
        }

        // Subir nueva imagen
        const imageKey = `products/${productId}/${imageFile.filename}`;
        image_url = await uploadToS3(
          imageFile.buffer,
          imageKey,
          imageFile.mimeType,
        );
      } catch (uploadError) {
        console.error("Error uploading image to S3:", uploadError);
        const error = new Error("Error al procesar la imagen");
        error.name = "S3UploadError";
        throw error;
      }
    }

    // Actualizar producto
    const product = await productRepository.update(productId, {
      name,
      description,
      price,
      stock,
      category_id,
      category_name,
      ...(imageFile && { image_url }),
    });

    return product;
  }

  async deleteProduct(productId) {
    // Verificar que el producto existe
    const product = await productRepository.findById(productId);

    if (!product) {
      const error = new Error("Producto no encontrado");
      error.name = "ProductNotFoundError";
      throw error;
    }

    // Verificar si está referenciado en órdenes
    const hasOrderReferences =
      await productRepository.hasOrderReferences(productId);

    // Si tiene referencias => SOFT DELETE
    if (hasOrderReferences) {
      const updatedProduct = await productRepository.softDelete(productId);

      return {
        softDeleted: true,
        message:
          "Producto referenciado por órdenes. Se desactivó en lugar de eliminar para preservar historial.",
        product: updatedProduct,
      };
    }

    // Eliminar imagen de S3 si existe
    if (product.image_url) {
      const imageKey = getS3KeyFromUrl(product.image_url);
      if (imageKey) {
        try {
          await deleteFromS3(imageKey);
        } catch (s3Error) {
          console.warn("Could not delete image from S3:", s3Error.message);
          // No falla la operación si no se puede eliminar la imagen
        }
      }
    }

    // Hard delete de DynamoDB
    await productRepository.delete(productId);

    return {
      softDeleted: false,
      message: "Producto eliminado correctamente",
      product: {
        id: product.id,
        name: product.name,
      },
    };
  }

  async toggleProductStatus(productId) {
    const updatedProduct = await productRepository.toggleStatus(productId);

    if (!updatedProduct) {
      const error = new Error("Producto no encontrado");
      error.name = "ProductNotFoundError";
      throw error;
    }

    return updatedProduct;
  }
}

export const adminProductService = new AdminProductService();
