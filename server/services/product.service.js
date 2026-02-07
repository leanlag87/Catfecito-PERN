import { productRepository } from "../repositories/product.repository.js";

class ProductService {
  //Obtener todos los productos activos
  async getAllProducts() {
    const products = await productRepository.findAll();

    return {
      count: products.length,
      products,
    };
  }

  async getProductById(productId) {
    const product = await productRepository.findById(productId);

    if (!product) {
      const error = new Error("Producto no encontrado");
      error.name = "ProductNotFoundError";
      throw error;
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at,
      category_id: product.category_id,
      category_name: product.category_name,
    };
  }
}

export const productService = new ProductService();
