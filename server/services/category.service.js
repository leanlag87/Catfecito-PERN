import { categoryRepository } from "../repositories/category.repository.js";

class CategoryService {
  async getAllCategories() {
    const categories = await categoryRepository.findAll();

    return {
      count: categories.length,
      categories,
    };
  }
}

export const categoryService = new CategoryService();
