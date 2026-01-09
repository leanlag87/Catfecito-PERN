import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../pages/Profile.css';

export const ProfileNav = () => {
  return (
    <nav className="profile-nav" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <NavLink to="/profile/info" className={({isActive})=> isActive ? 'btn-primary' : 'btn-secondary'}>
        Mi Información
      </NavLink>
      <NavLink to="/profile/orders" className={({isActive})=> isActive ? 'btn-primary' : 'btn-secondary'}>
        Mis Pedidos
      </NavLink>
      <NavLink to="/profile/address" className={({isActive})=> isActive ? 'btn-primary' : 'btn-secondary'}>
        Mi Dirección
      </NavLink>
    </nav>
  );
};

export default ProfileNav;
