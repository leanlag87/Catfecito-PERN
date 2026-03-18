import { useState } from "react";
import { useAdminProducts } from "../hooks";
import "./AdminProfile/AdminProfile.css";

export default function AdminDelete() {
  const { products, isLoading, error, deleteProductById, clearError } =
    useAdminProducts();

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
    setMessageType("");
    setLoadingProduct(true);

    const selectedProduct = products.find((p) => p.id === Number(id));

    if (selectedProduct) {
      setProduct(selectedProduct);
    } else {
      setProduct(null);
      setMessage("No se pudo cargar el producto");
      setMessageType("error");
    }

    setLoadingProduct(false);
  };

  const remove = async (e) => {
    e.preventDefault();
    clearError?.();
    setMessage("");

    if (!id) {
      setMessage("Id requerido");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar este producto?",
    );
    if (!confirmed) return;

    const result = await deleteProductById(id);

    if (result?.success) {
      setMessage("Producto eliminado");
      setMessageType("success");
      setProduct(null);
      setId("");
    } else {
      setMessage(result?.error || "No se pudo eliminar el producto");
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
      <h3>Eliminar producto</h3>

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

      <form onSubmit={remove} className="iud-products-admin">
        <div>
          <label>Producto</label>
          <div className="product-select-update">
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
              <div>{product.name}</div>
              <div>Precio: ${product.price}</div>
              <div>Stock: {product.stock}</div>
            </div>
          </div>
        )}

        <label>Producto ID</label>
        <input value={id} onChange={(e) => setId(e.target.value)} required />

        <button className="btn-primary-admin" disabled={isLoading}>
          {isLoading ? "Eliminando..." : "Eliminar"}
        </button>
      </form>
    </section>
  );
}
