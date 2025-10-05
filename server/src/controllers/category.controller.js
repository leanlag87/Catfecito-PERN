import { pool } from "../db.js";

// Obtener todas las categorías activas
export async function getAllCategories(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, description, image_url, is_active, created_at, updated_at
       FROM categories 
       WHERE is_active = TRUE
       ORDER BY name ASC`
    );

    return res.status(200).json({
      success: true,
      count: result.rowCount,
      categories: result.rows,
    });
  } catch (error) {
    console.error("Error en getAllCategories:", error);
    return res.status(500).json({ message: "Error al obtener categorías" });
  }
}

// Obtener categoría por ID
export async function getCategoryById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, name, description, image_url, is_active, created_at, updated_at
       FROM categories 
       WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    return res.status(200).json({
      success: true,
      category: result.rows[0],
    });
  } catch (error) {
    console.error("Error en getCategoryById:", error);
    return res.status(500).json({ message: "Error al obtener categoría" });
  }
}

// SOLO ADMIN

// Crear categoría
export async function createCategory(req, res) {
  const { name, description, image_url } = req.body;

  if (!name) {
    return res.status(400).json({ message: "El nombre es requerido" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO categories (name, description, image_url) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, description, image_url, is_active, created_at, updated_at`,
      [name, description || null, image_url || null]
    );

    return res.status(201).json({
      success: true,
      message: "Categoría creada exitosamente",
      category: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe una categoría con ese nombre",
      });
    }
    console.error("Error en createCategory:", error);
    return res.status(500).json({ message: "Error al crear categoría" });
  }
}

// Actualizar categoría
export async function updateCategory(req, res) {
  const { id } = req.params;
  const { name, description, image_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE categories 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           image_url = COALESCE($3, image_url),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, description, image_url, is_active, created_at, updated_at`,
      [name, description, image_url, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    return res.status(200).json({
      success: true,
      message: "Categoría actualizada exitosamente",
      category: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe una categoría con ese nombre",
      });
    }
    console.error("Error en updateCategory:", error);
    return res.status(500).json({ message: "Error al actualizar categoría" });
  }
}

// Activar/desactivar categoría
export async function toggleCategoryStatus(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE categories 
       SET is_active = NOT is_active, updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, name, description, image_url, is_active`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    return res.status(200).json({
      success: true,
      message: `Categoría ${
        result.rows[0].is_active ? "activada" : "desactivada"
      } exitosamente`,
      category: result.rows[0],
    });
  } catch (error) {
    console.error("Error en toggleCategoryStatus:", error);
    return res
      .status(500)
      .json({ message: "Error al cambiar estado de categoría" });
  }
}

// Eliminar categoría
export async function deleteCategory(req, res) {
  const { id } = req.params;

  try {
    //Verificar si hay productos asociados
    const productsCount = await pool.query(
      "SELECT COUNT(*) FROM products WHERE category_id = $1",
      [id]
    );

    if (parseInt(productsCount.rows[0].count) > 0) {
      return res.status(400).json({
        message: "No se puede eliminar una categoría con productos asociados",
      });
    }

    const result = await pool.query(
      "DELETE FROM categories WHERE id = $1 RETURNING id, name",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    return res.status(200).json({
      success: true,
      message: "Categoría eliminada exitosamente",
      category: result.rows[0],
    });
  } catch (error) {
    console.error("Error en deleteCategory:", error);
    return res.status(500).json({ message: "Error al eliminar categoría" });
  }
}
