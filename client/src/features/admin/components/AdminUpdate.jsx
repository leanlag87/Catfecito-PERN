import { useState } from "react";
import { useAdminProducts } from "../hooks";
import "./AdminProfile/AdminProfile.css";

export default function AdminUpdate() {
  const {
    products,
    categories,
    form,
    formErrors,
    imageFile,
    isLoading,
    error,
    setField,
    setImageFile,
    setFormFromProduct,
    updateProductById,
    clearError,
  } = useAdminProducts();

  const [id, setId] = useState("");
  const [product, setProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loadingProduct, setLoadingProduct] = useState(false);

  const loadProduct = async () => {
    if (!id) {
      setMessage("Selecciona un producto");
      setMessageType("error");
      return;
    }

    setMessage("");
    setLoadingProduct(true);

    const selectedProduct = products.find((p) => p.id === Number(id));

    if (selectedProduct) {
      setProduct(selectedProduct);
      setFormFromProduct(selectedProduct);
      setMessageType("");
    } else {
      setProduct(null);
      setMessage("No se pudo cargar el producto");
      setMessageType("error");
    }

    setLoadingProduct(false);
  };

  const update = async (e) => {
    e.preventDefault();
    clearError?.();
    setMessage("");
    setMessageType("");

    if (!id) {
      setMessage("Id requerido");
      setMessageType("error");
      return;
    }

    const result = await updateProductById(id);

    if (result?.success) {
      setMessage(result?.data?.message || "Producto actualizado");
      setMessageType("success");
      setImageFile(null);
    } else if (result?.validation) {
      setMessage("Revisa los campos del formulario");
      setMessageType("error");
    } else {
      setMessage(result?.error || "No se pudo actualizar");
      setMessageType("error");
    }
  };

  const imageSrc = product?.imageUrl
    ? import.meta.env.VITE_BACKEND_URL
      ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}${product.imageUrl}`
      : product.imageUrl
    : "/placeholder-coffee.jpg";

  return (
    <section className="profile-card-admin">
      <h3>Actualizar producto</h3>

      {(message || error) && (
        <div
          className={
            messageType === "success"
              ? "profile-success-admin"
              : "profile-error-admin"
          }
        >
          {message || error}
        </div>
      )}

      <form onSubmit={update} className="iud-products-admin">
        <div>
          <label>Producto</label>
          <div className="product-select-update">
            <div>
              <select value={id} onChange={(e) => setId(e.target.value)}>
                <option value="">-- Selecciona un producto --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.stock != null ? `(${p.stock})` : ""}
                  </option>
                ))}
              </select>

              <button
                className="btn-secondary-admin"
                onClick={(e) => {
                  e.preventDefault();
                  loadProduct();
                }}
                disabled={loadingProduct || !id}
              >
                {loadingProduct ? "Cargando..." : "Cargar"}
              </button>
            </div>
          </div>
        </div>

        {product && (
          <div>
            <img
              src={imageSrc}
              alt={product.name}
              style={{
                width: 120,
                height: 80,
                objectFit: "cover",
                borderRadius: 6,
              }}
            />
            <div>
              <div style={{ fontWeight: 700 }}>{product.name}</div>
              <div>Precio: ${product.price}</div>
              <div>Stock: {product.stock}</div>
            </div>
          </div>
        )}

        <label>Nombre</label>
        <input
          name="name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          required
        />
        {formErrors.name && (
          <span className="field-error">{formErrors.name}</span>
        )}

        <label>Descripción</label>
        <textarea
          name="description"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={4}
        />
        {formErrors.description && (
          <span className="field-error">{formErrors.description}</span>
        )}

        <label>Precio</label>
        <input
          type="number"
          min="0"
          step="0.01"
          name="price"
          value={form.price}
          onChange={(e) => setField("price", e.target.value)}
          required
        />
        {formErrors.price && (
          <span className="field-error">{formErrors.price}</span>
        )}

        <label>Stock</label>
        <input
          type="number"
          min="0"
          step="1"
          name="stock"
          value={form.stock}
          onChange={(e) => setField("stock", e.target.value)}
        />
        {formErrors.stock && (
          <span className="field-error">{formErrors.stock}</span>
        )}

        <label>Categoría</label>
        <select
          name="category_id"
          value={form.category_id}
          onChange={(e) => setField("category_id", e.target.value)}
          required
        >
          <option value="">Selecciona</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {formErrors.category_id && (
          <span className="field-error">{formErrors.category_id}</span>
        )}

        <label>Imagen</label>
        <div className="insert-product-image">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          {imageFile && <div>✓ {imageFile.name}</div>}
        </div>

        <button className="btn-primary-admin" disabled={isLoading}>
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </form>
    </section>
  );
}
