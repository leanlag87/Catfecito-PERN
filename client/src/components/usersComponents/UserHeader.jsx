import React from "react";
import api from "../../services/api";
import "../CustomBarComponents/Header.css";
import group from "../../assets/img/Group.svg";
import user from "../../assets/img/user.svg";
import logout from "../../assets/img/logout.svg";
import { useNavigate } from "react-router-dom";

export const UserHeader = () => {

  const navigate = useNavigate();

  const handleNavigateToHome = () => {
    console.log('Navegando a home...');
    navigate('/');
    console.log('Navigate ejecutado');
  };

  const handleNavigateToProducts = () => {
    console.log('Navegando a products...');
    navigate('/products');
    console.log('Navigate ejecutado');
  };

  const handleLogout = async () => {
    const token = sessionStorage.getItem('authToken');
    try {
      if (token) {
        await api.post('/auth/logout', {});
      }
    } catch {
      // ignorar errores de logout
    } finally {
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authUser');
      navigate('/');
    }
  };


  return (
    <div className="header">
      <div className="left-group">
        <div className="logo-container" onClick={handleNavigateToHome}>
          <img src={group} alt="Catfecito logo" />
        </div>
        <button
          type="button"
          className="shop-button"
          onClick={handleNavigateToProducts}
          aria-label="Volver a la tienda"
        >
          Shop
        </button>
      </div>
      
      <div className="user-icons">
        <button
          type="button"
          className="profile-button"
          onClick={() => {
            const token = sessionStorage.getItem('authToken');
            if (!token) return navigate('/login');

            // 1) Try role from stored user
            let role = undefined;
            try {
              const u = JSON.parse(sessionStorage.getItem('authUser') || 'null');
              role = u?.role;
            } catch {
              // ignore JSON parse errors
            }

            // 2) Fallback: decode JWT payload (no verify, solo lectura)
            if (!role) {
              try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const payload = JSON.parse(jsonPayload);
                role = payload?.role;
              } catch {
                // ignore jwt decode errors
              }
            }

            navigate(role === 'admin' ? '/admin' : '/profile');
          }}
        >
          <img className="user" src={user} alt="Usuario" />
        </button>
        {logout && (
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <img className="log-out" src={logout} alt="Cerrar sesión" />
          </button>
        )}
      </div>

      
    </div>
  );
};
