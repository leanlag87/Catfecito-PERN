import { categoryRepository } from "../../repositories/category.repository.js";
import { generateSlug } from "../../utils/helpers.js";

class AdminCategoryService {
  async createCategory(categoryData) {
    const { name, description } = categoryData;

    // Validaciones
    if (!name || !name.trim()) {
      const error = new Error("El nombre es requerido");
      error.name = "ValidationError";
      throw error;
    }

    const trimmedName = name.trim();

    // Verificar si ya existe una categoría con ese nombre
    const existingByName = await categoryRepository.findByName(trimmedName);

    if (existingByName) {
      const error = new Error("Ya existe una categoría con ese nombre");
      error.name = "CategoryExistsError";
      throw error;
    }

    // Generar ID único basado en el nombre
    let categoryId = generateSlug(trimmedName);

    // Verificar que el ID no exista
    const existsById = await categoryRepository.existsById(categoryId);

    // Si el ID ya existe, agregar timestamp
    if (existsById) {
      categoryId = `${categoryId}-${Date.now()}`;
    }

    // Crear categoría
    const category = await categoryRepository.create({
      id: categoryId,
      name: trimmedName,
      description: description?.trim(),
    });

    return category;
  }
}

export const adminCategoryService = new AdminCategoryService();
