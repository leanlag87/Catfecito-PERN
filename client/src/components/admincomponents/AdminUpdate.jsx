
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../pages/AdminProfile.css';

export default function AdminUpdate() {
  const [id, setId] = useState('');
  const [product, setProduct] = useState(null);
  const [payload, setPayload] = useState({ name: '', price: '', stock: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productsList, setProductsList] = useState([]);

  const update = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!id) { setMessage('Id requerido'); return; }
    setLoading(true);
    try {
      let body;
      
      if (imageFile) {
        // Si hay imagen, usar FormData
        body = new FormData();
        Object.keys(payload).forEach(k => { if (payload[k] !== '') body.append(k, payload[k]); });
        body.append('image', imageFile);
        console.log('Enviando con imagen:', imageFile.name);
      } else {
        // Sin imagen, usar objeto JSON
        body = {};
        Object.keys(payload).forEach(k => { if (payload[k] !== '') body[k] = payload[k]; });
        console.log('Enviando sin imagen');
      }
      
      const { data } = await api.put(`/products/${id}`, body);
      setMessage(data?.message || 'Producto actualizado');
      setMessageType('success');
      setImageFile(null);
    } catch (err) {
      console.error('Error al actualizar:', err);
      setMessage(err?.response?.data?.message || 'Error al actualizar');
      setMessageType('error');
    } finally { setLoading(false); }
  };

  const loadProduct = async () => {
    if (!id) return setMessage('Selecciona un producto');
    setMessage('');
    setLoadingProduct(true);
    try {
      const { data } = await api.get(`/products/${id}`);
      const p = data?.product || null;
      setProduct(p);
      setImageFile(null);
      if (p) {
        setPayload({
          name: p.name || '',
          price: p.price != null ? String(p.price) : '',
          stock: p.stock != null ? String(p.stock) : '',
          description: p.description || ''
        });
      }
    } catch (err) {
      setMessage(err?.response?.data?.message || 'No se pudo cargar el producto');
      setMessageType('error');
      setProduct(null);
    } finally { setLoadingProduct(false); }
  };

  const onFile = (e) => setImageFile(e.target.files?.[0] || null);

  useEffect(() => {
    // Cargar lista de productos para el select
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/products');
        const list = Array.isArray(data?.products) ? data.products : (Array.isArray(data) ? data : []);
        if (mounted) setProductsList(list);
      } catch (e) {
        console.error('No se pudo cargar lista de productos', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="profile-card-admin">
      <h3>Actualizar producto</h3>
      {message && (
        <div className={messageType === 'success' ? 'profile-success-admin' : (messageType === 'error' ? 'profile-error-admin' : '')}>
          {message}
        </div>
      )}
      <form onSubmit={update} className="iud-products-admin">
        <div>
          <label>Producto</label>
          <div className="product-select-update">
            <div>
              <select value={id} onChange={(e)=>{ setId(e.target.value); }}>
                <option value="">-- Selecciona un producto --</option>
                {productsList.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.stock != null ? `(${p.stock})` : ''}</option>
                ))}
              </select>
              <button className="btn-secondary-admin" onClick={(e)=>{ e.preventDefault(); loadProduct(); }} disabled={loadingProduct || !id}>{loadingProduct ? 'Cargando...' : 'Cargar'}</button>
            </div>
          </div>
        </div>

        {product && (
          <div>
            <img src={product.image_url ? (import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')}${product.image_url}` : product.image_url) : '/placeholder-coffee.jpg'} alt={product.name} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
            <div>
              <div style={{ fontWeight: 700 }}>{product.name}</div>
              <div>Precio: ${product.price}</div>
              <div>Stock: {product.stock}</div>
            </div>
          </div>
        )}

        <label>Nombre</label>
        <input value={payload.name} onChange={(e)=>setPayload({...payload, name: e.target.value})} required />

        <label>Descripción</label>
        <textarea value={payload.description} onChange={(e)=>setPayload({...payload, description: e.target.value})} />

        <label>Precio</label>
        <input type="number" min="0" step="0.01" value={payload.price} onChange={(e)=>setPayload({...payload, price: e.target.value})} required />

        <label>Stock</label>
        <input type="number" min="0" step="1" value={payload.stock} onChange={(e)=>setPayload({...payload, stock: e.target.value})} />

        <label>Imagen</label>
        <div className="insert-product-image">
          <input type="file" accept="image/*" onChange={onFile} />
          {imageFile && (
            <div>
              ✓ {imageFile.name}
            </div>
          )}
        </div>

        <button className="btn-primary-admin" disabled={loading}>{loading ? 'Actualizando...' : 'Actualizar'}</button>
      </form>
    </section>
  );
}
