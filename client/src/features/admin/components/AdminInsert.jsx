import { useState } from "react";
import { useAdminProducts } from "../hooks";
import "./AdminProfile/AdminProfile.css";

export default function AdminInsert() {
  const {
    categories,
    form,
    formErrors,
    imageFile,
    isLoading,
    error,
    setField,
    setImageFile,
    createProduct,
    resetForm,
    clearError,
  } = useAdminProducts();

  const [success, setSuccess] = useState("");

  const onChange = (e) => {
    setField(e.target.name, e.target.value);
  };

  const onFile = (e) => {
    setImageFile(e.target.files?.[0] || null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSuccess("");
    clearError?.();

    const result = await createProduct();

    if (result?.success) {
      setSuccess(result?.data?.message || "Producto creado");
      resetForm();
    }
  };

  return (
    <section className="profile-card-admin">
      <h3>Agregar producto</h3>
      {error && <div className="profile-error">{error}</div>}
      {success && <div className="profile-success">{success}</div>}

      <form onSubmit={submit} className="iud-products-admin">
        <label>Nombre</label>
        <input name="name" value={form.name} onChange={onChange} required />
        {formErrors.name && (
          <span className="field-error">{formErrors.name}</span>
        )}

        <label>Descripción</label>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={4}
          required
        />
        {formErrors.description && (
          <span className="field-error">{formErrors.description}</span>
        )}

        <label>Precio</label>
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={onChange}
          required
        />
        {formErrors.price && (
          <span className="field-error">{formErrors.price}</span>
        )}

        <label>Stock</label>
        <input
          name="stock"
          type="number"
          min="0"
          step="1"
          value={form.stock}
          onChange={onChange}
        />
        {formErrors.stock && (
          <span className="field-error">{formErrors.stock}</span>
        )}

        <label>Categoría</label>
        <select
          name="category_id"
          value={form.category_id}
          onChange={onChange}
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
          <input type="file" accept="image/*" onChange={onFile} />
          {imageFile && <div>✓ {imageFile.name}</div>}
        </div>

        <button className="btn-primary-admin" disabled={isLoading}>
          {isLoading ? "Creando..." : "Crear"}
        </button>
      </form>
    </section>
  );
}
