import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserHeader } from '../components/usersComponents/UserHeader';
import MetaData from '../components/ui/MetaData/MetaData';
import api from '../services/api';
import { CheckoutButton } from '../components/checkoutPageComponent/CheckoutButton';
import '../components/checkoutPageComponent/CheckoutButton.css';
import './CheckoutPage.css';

export const CheckoutPage = ({
  cartItems = [],
  subtotal = 0,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const orderId = searchParams.get('order_id');
  const [form, setForm] = useState({
    country: 'Argentina',
    firstName: '',
    lastName: '',
    address: '',
    address2: '',
    zip: '',
    city: '',
    state: 'Buenos Aires',
    phone: '',
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [preferenceId, setPreferenceId] = useState(null);
  const [error, setError] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [saveAddress, setSaveAddress] = useState(false); // Checkbox para guardar dirección

  const total = useMemo(() => subtotal, [subtotal]);
  const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '') : '';
  const getToken = () => (sessionStorage.getItem('authToken') || sessionStorage.getItem('token') || '').toString().trim();
  

    // Traemos imagenes de los items del carrito
    const getItemImageSrc = (it) => {
    if (!it) return '';
    let v = it.image ?? it.image_url ?? '';
    // Si es un objeto con propiedad url
    if (v && typeof v === 'object' && typeof v.url === 'string') {
      v = v.url;
    }
    if (typeof v !== 'string') return '';
    const src = v.trim();
    if (!src) return '';
    // Aceptar URLs absolutas y data URLs
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    // Asegurarse de que BACKEND_ORIGIN exista antes de la concatenación
    if (!BACKEND_ORIGIN) return src;
    return `${BACKEND_ORIGIN}${src.startsWith('/') ? '' : '/'}${src}`;
    };
  // Manejar retorno de pago fallido
  useEffect(() => {
    if (paymentStatus === 'failure' && orderId) {
      setError('❌ El pago no se pudo completar. Por favor, intenta nuevamente.');
      // Limpiar parámetros de URL
      window.history.replaceState({}, '', '/checkout');
    }
    // Si el pago fue exitoso, redirigir a mis órdenes
    if (paymentStatus === 'success') {
      navigate('/profile/orders?payment=success&order_id=' + orderId);
    }
  }, [paymentStatus, orderId, navigate]);

  // Cargar dirección predeterminada del usuario
  useEffect(() => {
    const loadUserAddress = async () => {
      const token = getToken();
      if (!token) {
        setIsLoadingAddress(false);
        return;
      }

      try {
        const response = await api.get('/users/profile');

        const data = response.data;
        const user = data?.user;

        // Autocompletar formulario con dirección guardada
        if (user) {
          // Extraer nombre y apellido del campo "name"
          const nameParts = (user.name || '').trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          setForm({
            country: user.default_country || 'Argentina',
            firstName: firstName,
            lastName: lastName,
            address: user.default_address || '',
            address2: user.default_address2 || '',
            zip: user.default_zip || '',
            city: user.default_city || '',
            state: user.default_state || 'Buenos Aires',
            phone: user.default_phone || '',
          });
        }
      } catch (err) {
        console.error('Error cargando dirección:', err);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    loadUserAddress();
  }, [navigate]);

  // Verificar si el formulario está completo para mostrar el botón de pago
  const isFormComplete = useMemo(() => {
    return !!(
      form.firstName &&
      form.lastName &&
      form.address &&
      form.city &&
      form.zip &&
      cartItems.length > 0 &&
      !isLoadingAddress
    );
  }, [form, cartItems.length, isLoadingAddress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    
    // Si ya se creó una orden, resetear el proceso al cambiar datos
    // PERO solo si el usuario realmente modifica algo importante (no solo al tipear)
    if (preferenceId) {
      console.warn('⚠️ Se modificaron datos después de crear la orden. Considera resetear.');
      // Opcional: descomentar para forzar reset
      // setPreferenceId(null);
      // setError('Datos modificados. Por favor, crea una nueva orden.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validar campos requeridos
    if (!form.firstName || !form.lastName || !form.address || !form.city || !form.zip) {
      setError('Por favor completa los campos requeridos.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }

    const token = getToken();
    if (!token) {
      setError('Debes iniciar sesión para continuar.');
      return;
    }

    // Si ya existe una preferencia, no crear otra
    if (preferenceId) {
      return;
    }

    setIsCreatingOrder(true);

    try {
      // 1. Guardar dirección si el usuario lo solicitó
      if (saveAddress) {
        try {
          await api.put('/users/address', {
            default_country: form.country,
            default_address: form.address,
            default_address2: form.address2,
            default_city: form.city,
            default_state: form.state,
            default_zip: form.zip,
            default_phone: form.phone,
          });
          // No mostrar error si falla guardar dirección, continuar con la orden
        } catch (e) {
          console.log('No se pudo guardar la dirección (continuando):', e);
        }
      }

      // 2. Crear orden con dirección completa
      const orderResp = await api.post('/orders', {
        shipping_first_name: form.firstName,
        shipping_last_name: form.lastName,
        shipping_country: form.country,
        shipping_address: form.address,
        shipping_address2: form.address2,
        shipping_city: form.city,
        shipping_state: form.state,
        shipping_zip: form.zip,
        shipping_phone: form.phone,
      });

      const orderData = orderResp.data;
      const createdOrderId = orderData?.order?.id;
      if (!createdOrderId) throw new Error('No se obtuvo el ID de la orden');

      // 2. Crear preferencia de MercadoPago
      const prefResp = await api.post('/payments/create-preference', { order_id: createdOrderId });

      const prefData = prefResp.data;
      setPreferenceId(prefData.preference_id);

    } catch (err) {
      setError(err.message || 'Error al procesar el pago');
      console.error('Error en checkout:', err);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <div className="checkout-page">
      <MetaData title="Pantalla de pago - Catfecito" />
      <div className="checkout-header-wrapper">
        <UserHeader />
      </div>

      <main className="checkout-content">
        <section className="checkout-left">
          <h2>Dirección de facturación</h2>
          <form className="shipping-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>País / Región</label>
              <select name="country" value={form.country} onChange={handleChange}>
                <option>Argentina</option>
                <option>Colombia</option>
                <option>Chile</option>
                <option>Perú</option>
              </select>
            </div>

            <div className="form-row two">
              <div>
                <label>Nombre</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Nombre" />
              </div>
              <div>
                <label>Apellidos</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Apellidos" />
              </div>
            </div>

            <div className="form-row">
              <label>Dirección</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Dirección" />
            </div>

            <div className="form-row">
              <label>Casa, apartamento, etc. (opcional)</label>
              <input name="address2" value={form.address2} onChange={handleChange} placeholder="Casa, apartamento, etc." />
            </div>

            <div className="form-row three">
              <div>
                <label className="label-postal">Código postal</label>
                <input name="zip" value={form.zip} onChange={handleChange} placeholder="Código postal" />
              </div>
              <div>
                <label>Ciudad</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="Ciudad" />
              </div>
              <div>
                <label>Provincia</label>
                <select name="state" value={form.state} onChange={handleChange}>
                  <option>Buenos Aires</option>
                  <option>Córdoba</option>
                  <option>Santa Fe</option>
                  <option>Mendoza</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <label>Teléfono (opcional)</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Teléfono" />
            </div>

            <div className="form-row" style={{ marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px' }}>Guardar esta dirección como predeterminada</span>
              </label>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button 
              type="submit" 
              className={`submit-btn ${preferenceId ? 'hidden' : ''}`}
              disabled={isCreatingOrder || preferenceId || isLoadingAddress}
            >
              {isLoadingAddress ? 'Cargando...' : isCreatingOrder ? 'Procesando...' : 'Continuar al pago'}
            </button>
          </form>
        </section>

        <aside className="checkout-right">
          <h3>Tu pedido</h3>
          {isLoadingAddress ? (
            <p>Cargando información...</p>
          ) : (
            <>
              <div className="order-items">
                {cartItems.length === 0 ? (
                  <p>No hay productos en el carrito.</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="order-item">
                      <div className="order-item-left">
                        <img src={getItemImageSrc(item)} alt={item.name} />
                        <div>
                          <div className="name">{item.name}</div>
                          <div className="unit-price">${Number(item.price).toLocaleString('es-AR')}</div>
                        </div>
                      </div>
                      <div className="order-item-right">
                        <div className="qty-container">
                          
                          <div className="qty">{item.quantity}</div>
                          
                        </div>
                        <div className="subtotal">${Number(item.price * item.quantity).toLocaleString('es-AR')}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="order-summary">
                <div className="row">
                  <span>Subtotal · {cartItems.reduce((s, i) => s + (i.quantity || 0), 0)} artículos</span>
                  <strong>${Number(total).toLocaleString('es-AR')}</strong>
                </div>
                <div className="row">
                  <span>Retiro en tienda</span>
                  <strong>GRATIS</strong>
                </div>
                <div className="row total">
                  <span>Total</span>
                  <strong>ARS ${Number(total).toLocaleString('es-AR')}</strong>
                </div>

                {preferenceId ? (
                <div style={{ marginTop: '1rem' }}>
                  <CheckoutButton
                    preferenceId={preferenceId}
                    onSuccess={() => console.log('✅ Pago iniciado')}
                    onError={(err) => {
                      console.error('Error en CheckoutButton:', err);
                      setError(err?.message || 'Error en el botón de pago');
                      // Permitir reintentar limpiando el preferenceId
                      setPreferenceId(null);
                    }}
                  />
                </div>
                ) : isFormComplete ? (
                  <div className="pay-notice" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #4caf50' }}>
                    <p>✓ Datos completos. Haz clic en "Continuar al pago" para proceder.</p>
                  </div>
                  ) : (
                  <div className="pay-notice">
                    <p>Completa tus datos de envío para continuar</p>
                  </div>
                  )}
              </div>
            </>
          )}
        </aside>
      </main>
    </div>
  );
};

export default CheckoutPage;
