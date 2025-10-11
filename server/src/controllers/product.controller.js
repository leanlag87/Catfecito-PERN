import { pool } from "../db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FUNCIONES User + Admin

// Obtener todos los productos activos
export async function getAllProducts(req, res) {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.stock, 
              p.image_url, p.is_active, p.created_at, p.updated_at,
              c.id as category_id, c.name as category_name
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE
       ORDER BY p.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rowCount,
      products: result.rows,
    });
  } catch (error) {
    console.error("Error en getAllProducts:", error);
    return res.status(500).json({ message: "Error al obtener productos" });
  }
}

// Obtener producto por ID
export async function getProductById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.stock, 
              p.image_url, p.is_active, p.created_at, p.updated_at,
              c.id as category_id, c.name as category_name
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    return res.status(200).json({
      success: true,
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Error en getProductById:", error);
    return res.status(500).json({ message: "Error al obtener producto" });
  }
}

// Obtener productos por categoría
export async function getProductsByCategory(req, res) {
  const { categoryId } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.stock, 
              p.image_url, p.is_active, p.created_at, p.updated_at,
              c.id as category_id, c.name as category_name
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       WHERE p.category_id = $1 AND p.is_active = TRUE
       ORDER BY p.created_at DESC`,
      [categoryId]
    );

    return res.status(200).json({
      success: true,
      count: result.rowCount,
      products: result.rows,
    });
  } catch (error) {
    console.error("Error en getProductsByCategory:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener productos por categoría" });
  }
}

// SOLO ADMIN

// Crear producto (con imagen)
export async function createProduct(req, res) {
  const { name, description, price, stock, category_id } = req.body;

  // Validaciones
  if (!name || !description || !price || !category_id) {
    // Si hay archivo subido, eliminarlo
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      message: "Nombre, descripción, precio y categoría son requeridos",
    });
  }

  if (parseFloat(price) < 0) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: "El precio debe ser positivo" });
  }

  if (stock && parseInt(stock) < 0) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: "El stock debe ser positivo" });
  }

  try {
    // Generar URL de la imagen si existe
    let image_url = null;
    if (req.file) {
      image_url = `/uploads/products/${req.file.filename}`;
    }

    // Verificar que la categoría existe
    const categoryExists = await pool.query(
      "SELECT 1 FROM categories WHERE id = $1",
      [category_id]
    );

    if (categoryExists.rowCount === 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    // Crear producto
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, category_id, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, description, price, stock, category_id, image_url, is_active, created_at, updated_at`,
      [name, description, price, stock || 0, category_id, image_url]
    );

    return res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      product: result.rows[0],
    });
  } catch (error) {
    // Si hay error, eliminar archivo subido
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Error en createProduct:", error);
    return res.status(500).json({ message: "Error al crear producto" });
  }
}

// Actualizar producto (con imagen opcional)
/**
 *
 * Se puede actualizar los productos desde insomnia, ya se de tipo json o form-data
 * Para agregar o cambiar la imagen, usar form-data y el campo "image" de tipo file
 * No es obligatorio la modificacion de todos los campos, se pueden modificar solo algunos
 */
export async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, description, price, stock, category_id } = req.body;

  try {
    // Obtener producto actual
    const currentProduct = await pool.query(
      "SELECT image_url FROM products WHERE id = $1",
      [id]
    );

    if (currentProduct.rowCount === 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    let image_url = currentProduct.rows[0].image_url;

    // Si hay nueva imagen
    if (req.file) {
      // Eliminar imagen anterior si existe
      if (currentProduct.rows[0].image_url) {
        const oldImagePath = path.join(
          __dirname,
          "../../",
          currentProduct.rows[0].image_url
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Asignar nueva imagen
      image_url = `/uploads/products/${req.file.filename}`;
    }

    // Verificar categoría si se está actualizando
    if (category_id) {
      const categoryExists = await pool.query(
        "SELECT 1 FROM categories WHERE id = $1",
        [category_id]
      );

      if (categoryExists.rowCount === 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
    }

    // Actualizar producto
    const result = await pool.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock),
           category_id = COALESCE($5, category_id),
           image_url = COALESCE($6, image_url),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, description, price, stock, category_id, image_url, is_active, created_at, updated_at`,
      [name, description, price, stock, category_id, image_url, id]
    );

    return res.status(200).json({
      success: true,
      message: "Producto actualizado exitosamente",
      product: result.rows[0],
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Error en updateProduct:", error);
    return res.status(500).json({ message: "Error al actualizar producto" });
  }
}

// Activar/desactivar producto
export async function toggleProductStatus(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE products 
       SET is_active = NOT is_active, updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, name, is_active`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    return res.status(200).json({
      success: true,
      message: `Producto ${
        result.rows[0].is_active ? "activado" : "desactivado"
      } exitosamente`,
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Error en toggleProductStatus:", error);
    return res
      .status(500)
      .json({ message: "Error al cambiar estado del producto" });
  }
}

// Eliminar producto
export async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    // Obtener imagen antes de eliminar
    const product = await pool.query(
      "SELECT image_url FROM products WHERE id = $1",
      [id]
    );

    if (product.rowCount === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Eliminar producto de la BD
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id, name",
      [id]
    );

    // Eliminar imagen del servidor si existe
    if (product.rows[0].image_url) {
      const imagePath = path.join(
        __dirname,
        "../../",
        product.rows[0].image_url
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Producto eliminado exitosamente",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Error en deleteProduct:", error);
    return res.status(500).json({ message: "Error al eliminar producto" });
  }
}
