import { useState, useEffect } from "react";
import { useAdminStore } from "../stores/adminStore";
import "./AdminProfile/AdminProfile.css";

export default function AdminDelete() {
  const { products, fetchAllProducts, deleteProduct, isLoading } =
    useAdminStore();

  const [id, setId] = useState("");
  const [product, setProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loadingProduct, setLoadingProduct] = useState(false);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const loadProduct = async () => {
    if (!id) return setMessage("Selecciona un producto");
    setMessage("");
    setLoadingProduct(true);

    const selectedProduct = products.find((p) => p.id === parseInt(id));

    if (selectedProduct) {
      setProduct(selectedProduct);
    } else {
      setMessage("No se pudo cargar el producto");
      setMessageType("error");
      setProduct(null);
    }

    setLoadingProduct(false);
  };

  const remove = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!id) {
      setMessage("Id requerido");
      return;
    }

    const result = await deleteProduct(id);

    if (result.success) {
      setMessage("Producto eliminado");
      setMessageType("success");
      setProduct(null);
      setId("");
    } else {
      setMessage(result.error);
      setMessageType("error");
    }
  };

  return (
    <section className="profile-card-admin">
      <h3>Eliminar producto</h3>
      {message && (
        <div
          className={
            messageType === "success"
              ? "profile-success-admin"
              : messageType === "error"
                ? "profile-error-admin"
                : ""
          }
        >
          {message}
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
              src={
                product.image_url
                  ? import.meta.env.VITE_BACKEND_URL
                    ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}${product.image_url}`
                    : product.image_url
                  : "/placeholder-coffee.jpg"
              }
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
