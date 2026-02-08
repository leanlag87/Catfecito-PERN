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

  async updateCategory(categoryId, updateData) {
    const { name, description } = updateData;

    // Obtener categoría actual
    const currentCategory = await categoryRepository.findById(categoryId);

    if (!currentCategory) {
      const error = new Error("Categoría no encontrada");
      error.name = "CategoryNotFoundError";
      throw error;
    }

    let trimmedName = currentCategory.name;
    let trimmedDescription = currentCategory.description;
    let hasChanges = false;

    // Validar y preparar nombre si se está actualizando
    if (name !== undefined) {
      if (!name || !name.trim()) {
        const error = new Error("El nombre no puede estar vacío");
        error.name = "ValidationError";
        throw error;
      }

      trimmedName = name.trim();

      // Verificar duplicados si el nombre cambió
      if (trimmedName !== currentCategory.name) {
        const existingByName = await categoryRepository.findByName(trimmedName);

        if (existingByName && existingByName.id !== categoryId) {
          const error = new Error("Ya existe una categoría con ese nombre");
          error.name = "CategoryExistsError";
          throw error;
        }

        hasChanges = true;
      }
    }

    // Preparar descripción si se está actualizando
    if (description !== undefined) {
      trimmedDescription = description?.trim() || null;

      if (trimmedDescription !== currentCategory.description) {
        hasChanges = true;
      }
    }

    // Si no hay cambios, retornar categoría actual
    if (!hasChanges) {
      return currentCategory;
    }

    // Actualizar categoría
    const updatedCategory = await categoryRepository.update(categoryId, {
      ...(name !== undefined && { name: trimmedName }),
      ...(description !== undefined && { description: trimmedDescription }),
    });

    return updatedCategory;
  }

  async toggleCategoryStatus(categoryId) {
    const updatedCategory = await categoryRepository.toggleStatus(categoryId);

    if (!updatedCategory) {
      const error = new Error("Categoría no encontrada");
      error.name = "CategoryNotFoundError";
      throw error;
    }

    return updatedCategory;
  }
}

export const adminCategoryService = new AdminCategoryService();
