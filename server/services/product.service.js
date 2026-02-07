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
}

export const productService = new ProductService();
