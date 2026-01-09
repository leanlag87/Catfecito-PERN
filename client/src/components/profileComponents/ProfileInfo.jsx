import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../pages/Profile.css';

export default function ProfileInfo() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const load = async () => {
      try {
        const { data } = await api.get('/users/profile');
        setUser(data?.user || null);
      } catch (e) {
        if (e?.response?.status === 401) {
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('authUser');
          navigate('/login');
          return;
        }
        setError(e?.response?.data?.message || 'Error al cargar el perfil');
      }
    };
    load();
  }, [navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    try {
      const { data } = await api.put(
        '/users/change-password',
        { currentPassword, newPassword }
      );
      alert(data?.message || 'Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setError(e?.response?.data?.message || 'Error al cambiar la contraseña');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // ignorar errores de logout
    } finally {
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authUser');
      navigate('/');
    }
  };

  return (
    <>
      <section className="profile-card">
        {error && <div className="profile-error">{error}</div>}
        {user ? (
          <div className="profile-fields">
            <div className="field">
              <div className="field-label">Nombre</div>
              <div className="field-value">{user.name}</div>
            </div>
            <div className="field">
              <div className="field-label">Correo electrónico</div>
              <div className="field-value">{user.email}</div>
            </div>
          </div>
        ) : (
          <p>No se pudo cargar el perfil.</p>
        )}
      </section>

      <section className="profile-card">
        <div className="section-header">
          <h2 className="section-title">Seguridad</h2>
        </div>
        <form className="password-form" onSubmit={handleChangePassword}>
          <label>Contraseña actual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <label>Nueva contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <label>Confirmar nueva contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-primary">Actualizar contraseña</button>
        </form>
        <div class="cerrar-sesion-row">
        <button type="button" className="btn-danger" onClick={handleLogout}>
          Cerrar sesión
        </button>
        </div>
      </section>
    </>
  );
}
