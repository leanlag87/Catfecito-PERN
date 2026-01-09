import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../pages/AdminProfile.css';

export default function AdminDelete(){
  const [id, setId] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [messageType, setMessageType] = useState('');
  const [productsList, setProductsList] = useState([]);

  const remove = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!id) { setMessage('Id requerido'); return; }
    setLoading(true);
    try {
      const { data } = await api.delete(`/products/${id}`);
      setMessage(data?.message || 'Producto eliminado');
      setMessageType('success');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Error al eliminar');
      setMessageType('error');
    } finally { setLoading(false); }
  };

  const loadProduct = async () => {
    if (!id) return setMessage('Selecciona un producto');
    setMessage('');
    setLoadingProduct(true);
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data?.product || null);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'No se pudo cargar el producto');
      setMessageType('error');
      setProduct(null);
    } finally { setLoadingProduct(false); }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/products');
        const list = Array.isArray(data?.products) ? data.products : (Array.isArray(data) ? data : []);
        if (mounted) setProductsList(list);
      } catch (e) { console.error('No se pudo cargar lista de productos', e); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="profile-card-admin">
      <h3>Eliminar producto</h3>
      {message && (
        <div className={messageType === 'success' ? 'profile-success-admin' : (messageType === 'error' ? 'profile-error-admin' : '')}>
          {message}
        </div>
      )}
      

      <form onSubmit={remove} className="iud-products-admin">
          <div>
          <label>Producto</label>
          <div className="product-select-update">
            <select value={id} onChange={(e)=>setId(e.target.value)}>
              <option value="">-- Selecciona un producto --</option>
              {productsList.map(p => <option key={p.id} value={p.id}>{p.name} {p.stock != null ? `(${p.stock})` : ''}</option>)}
            </select>
            <button className="btn-secondary-admin" onClick={(e)=>{ e.preventDefault(); loadProduct(); }} disabled={loadingProduct || !id}>{loadingProduct ? 'Cargando...' : 'Cargar'}</button>
          </div>
        </div>

        {product && (
          <div>
            <img src={product.image_url ? (import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')}${product.image_url}` : product.image_url) : '/placeholder-coffee.jpg'} alt={product.name} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
            <div>
              <div>{product.name}</div>
              <div>Precio: ${product.price}</div>
              <div>Stock: {product.stock}</div>
            </div>
          </div>
        )}
        <label>Producto ID</label>
        <input value={id} onChange={(e)=>setId(e.target.value)} required />
        <button className="btn-primary-admin" disabled={loading}>{loading ? 'Eliminando...' : 'Eliminar'}</button>
      </form>
    </section>
  );
}
