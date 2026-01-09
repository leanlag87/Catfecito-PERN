import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../pages/AdminProfile.css';

export const AdminNav = () => {
  return (
    <nav className="profile-nav-admin" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <NavLink to="/admin/insert" className={({isActive})=> isActive ? 'btn-primary' : 'btn-secondary'}>Agregar producto</NavLink>
      <NavLink to="/admin/update" className={({isActive})=> isActive ? 'btn-primary' : 'btn-secondary'}>Actualizar producto</NavLink>
      <NavLink to="/admin/delete" className={({isActive})=> isActive ? 'btn-primary' : 'btn-secondary'}>Eliminar producto</NavLink>
      <NavLink to="/admin/orders" className={({isActive})=> isActive ? 'btn-primary' : 'btn-secondary'}>
              Pedidos
            </NavLink>
    </nav>
  );
};

export default AdminNav;
