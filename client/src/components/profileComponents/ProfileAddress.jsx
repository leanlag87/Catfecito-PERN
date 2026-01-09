import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../pages/Profile.css';

export default function ProfileAddress() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    default_country: '',
    default_address: '',
    default_address2: '',
    default_city: '',
    default_state: '',
    default_zip: '',
    default_phone: '',
  });

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    // Cargar dirección actual del usuario
    const loadAddress = async () => {
      try {
        const { data } = await api.get('/users/profile');
        const user = data?.user;
        if (user) {
          setFormData({
            default_country: user.default_country || '',
            default_address: user.default_address || '',
            default_address2: user.default_address2 || '',
            default_city: user.default_city || '',
            default_state: user.default_state || '',
            default_zip: user.default_zip || '',
            default_phone: user.default_phone || '',
          });
        }
      } catch (e) {
        if (e?.response?.status === 401) {
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('authUser');
          navigate('/login');
          return;
        }
        setError(e?.response?.data?.message || 'Error al cargar dirección');
      }
    };
    loadAddress();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await api.put(
        '/users/address',
        formData
      );
      setSuccess(data?.message || 'Dirección guardada exitosamente');
    } catch (e) {
      setError(e?.response?.data?.message || 'Error al guardar dirección');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="profile-card">
      <div className="section-header">
        <h2 className="section-title">Mi Dirección Predeterminada</h2>
      </div>
      <p style={{ marginBottom: '1rem', color: '#666', fontSize: '14px' }}>
        Esta dirección se utilizará para autocompletar el formulario de envío en futuras compras.
      </p>
      
      {error && <div className="profile-error">{error}</div>}
      {success && <div className="profile-success">{success}</div>}

      <form onSubmit={handleSubmit} className="address-form">
        <div className="address-form-row two-cols">
          <div>
            <label>País / Región *</label>
            <select
              name="default_country"
              value={formData.default_country}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar país</option>
              <option value="Argentina">Argentina</option>
              <option value="Colombia">Colombia</option>
              <option value="Chile">Chile</option>
              <option value="Perú">Perú</option>
              <option value="México">México</option>
            </select>
          </div>
          <div>
            <label>Teléfono *</label>
            <input
              type="tel"
              name="default_phone"
              value={formData.default_phone}
              onChange={handleChange}
              placeholder="+57 300 123 4567"
              required
            />
          </div>
        </div>

        <div>
          <label>Dirección *</label>
          <input
            type="text"
            name="default_address"
            value={formData.default_address}
            onChange={handleChange}
            placeholder="Calle 123 #45-67"
            required
          />
        </div>

        <div>
          <label>Apartamento, suite, etc. (opcional)</label>
          <input
            type="text"
            name="default_address2"
            value={formData.default_address2}
            onChange={handleChange}
            placeholder="Apto 301"
          />
        </div>

        <div className="address-form-row three-cols">
          <div>
            <label>Código postal *</label>
            <input
              type="text"
              name="default_zip"
              value={formData.default_zip}
              onChange={handleChange}
              placeholder="110111"
              required
            />
          </div>
          <div>
            <label>Ciudad *</label>
            <input
              type="text"
              name="default_city"
              value={formData.default_city}
              onChange={handleChange}
              placeholder="Bogotá"
              required
            />
          </div>
          <div>
            <label>Provincia / Estado *</label>
            <input
              type="text"
              name="default_state"
              value={formData.default_state}
              onChange={handleChange}
              placeholder="Cundinamarca"
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Dirección'}
        </button>
      </form>
    </section>
  );
}
