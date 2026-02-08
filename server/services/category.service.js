import { categoryRepository } from "../repositories/category.repository.js";

class CategoryService {
  async getAllCategories() {
    const categories = await categoryRepository.findAll();

    return {
      count: categories.length,
      categories,
    };
  }

  async getCategoryById(categoryId) {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      const error = new Error("Categoría no encontrada");
      error.name = "CategoryNotFoundError";
      throw error;
    }

    return category;
  }
}

export const categoryService = new CategoryService();
