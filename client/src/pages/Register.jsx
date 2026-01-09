import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Auth.css';
import logo from '../assets/img/Group.svg';

export const Register = ({ onSwitch, onSuccess }) => {
  const [firstName, setFirstname] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const name = `${firstName} ${lastName}`.trim();

    try {
        const { data } = await api.post('/auth/register', { 
            name, 
            email, 
            password 
        });

    if (data?.token) {
      sessionStorage.setItem('authToken', data.token);
      if (data.user) sessionStorage.setItem('authUser', JSON.stringify(data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      if (typeof onSuccess === 'function') return onSuccess(data);
      window.location.replace('/'); // recarga para sincronizar carrito
    } else {
      if (onSwitch) return onSwitch('login');
      navigate('/login');
    }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Error al registrarse');
    }
  };

  return (
    <main className="auth-container-register">
      <form className="auth-form" onSubmit={handleRegister}>
        <div className="auth-header">
          <h2>Registrarse</h2>
          <img src={logo} alt="CatFecito" className="auth-logo" />
        </div>

        <label>Nombre</label>
        <input type="text" value={firstName} onChange={e=>setFirstname(e.target.value)} required />

        <label>Apellido</label>
        <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} required />

        <label>Correo</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />

        <label>Contraseña</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

        <button type="submit">Crear cuenta</button>
  <p>¿Ya tenés cuenta? { onSwitch ? <button type="button" className="auth-link-btn" onClick={() => onSwitch('login')}>Ingresar</button> : <Link to="/login">Ingresar</Link> }</p>
      </form>
    </main>
  );
};