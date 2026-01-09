import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/Auth.css';
import logo from '../assets/img/Group.svg';

export const Login = ({ onSwitch, onSuccess }) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
  const { data } = await api.post('/auth/login', { email, password });
      // Espera { user, token, ... }
      if (data?.token) {
        sessionStorage.setItem('authToken', data.token);
        sessionStorage.setItem('authUser', JSON.stringify(data.user));
        window.dispatchEvent(new Event('authChanged'));
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        // Llamar onSuccess si fue pasado (permite cerrar modal sin navegar)
        if (typeof onSuccess === 'function') return onSuccess(data);
        // Fallback: recarga para compatibilidad con comportamiento previo
        window.location.replace('/');
      } else {
        console.error('Respuesta de login inválida');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert(error?.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <main className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <div className="auth-header">
          <h2>Iniciar sesión</h2>
          <img src={logo} alt="CatFecito" className="auth-logo" />
        </div>

        <label htmlFor="email">Correo electrónico</label>
        <input type="email"
          id="email"
          placeholder="tu@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="current-email"
        />

        <label htmlFor="password">Contraseña</label>
        <input 
          type="password"
          id="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button type="submit">Ingresar</button>
        <p>
          ¿No tenés cuenta? {
            onSwitch ? (
              <button type="button" className="auth-link-btn" onClick={() => onSwitch('register')}>Registrate</button>
            ) : (
              <Link to="/register">Registrate</Link>
            )
          }
        </p>
      </form>
    </main>
  );
};