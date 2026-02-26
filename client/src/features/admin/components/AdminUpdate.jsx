import { useState, useEffect } from "react";
import { useAdminStore } from "../stores/adminStore";
import "./AdminProfile.css";

export default function AdminUpdate() {
  const { products, fetchAllProducts, updateProduct, isLoading } =
    useAdminStore();

  const [id, setId] = useState("");
  const [product, setProduct] = useState(null);
  const [payload, setPayload] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
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
      setImageFile(null);
      setPayload({
        name: selectedProduct.name || "",
        price:
          selectedProduct.price != null ? String(selectedProduct.price) : "",
        stock:
          selectedProduct.stock != null ? String(selectedProduct.stock) : "",
        description: selectedProduct.description || "",
      });
    } else {
      setMessage("No se pudo cargar el producto");
      setMessageType("error");
      setProduct(null);
    }

    setLoadingProduct(false);
  };

  const update = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!id) {
      setMessage("Id requerido");
      return;
    }

    let body;

    if (imageFile) {
      body = new FormData();
      Object.keys(payload).forEach((k) => {
        if (payload[k] !== "") body.append(k, payload[k]);
      });
      body.append("image", imageFile);
    } else {
      body = {};
      Object.keys(payload).forEach((k) => {
        if (payload[k] !== "") body[k] = payload[k];
      });
    }

    const result = await updateProduct(id, body);

    if (result.success) {
      setMessage(result.data?.message || "Producto actualizado");
      setMessageType("success");
      setImageFile(null);
    } else {
      setMessage(result.error);
      setMessageType("error");
    }
  };

  const onFile = (e) => setImageFile(e.target.files?.[0] || null);

  return (
    <section className="profile-card-admin">
      <h3>Actualizar producto</h3>
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
              <div style={{ fontWeight: 700 }}>{product.name}</div>
              <div>Precio: ${product.price}</div>
              <div>Stock: {product.stock}</div>
            </div>
          </div>
        )}

        <label>Nombre</label>
        <input
          value={payload.name}
          onChange={(e) => setPayload({ ...payload, name: e.target.value })}
          required
        />

        <label>Descripción</label>
        <textarea
          value={payload.description}
          onChange={(e) =>
            setPayload({ ...payload, description: e.target.value })
          }
        />

        <label>Precio</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={payload.price}
          onChange={(e) => setPayload({ ...payload, price: e.target.value })}
          required
        />

        <label>Stock</label>
        <input
          type="number"
          min="0"
          step="1"
          value={payload.stock}
          onChange={(e) => setPayload({ ...payload, stock: e.target.value })}
        />

        <label>Imagen</label>
        <div className="insert-product-image">
          <input type="file" accept="image/*" onChange={onFile} />
          {imageFile && <div>✓ {imageFile.name}</div>}
        </div>

        <button className="btn-primary-admin" disabled={isLoading}>
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </form>
    </section>
  );
}
