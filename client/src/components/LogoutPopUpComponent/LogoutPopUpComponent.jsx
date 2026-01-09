import React from 'react';
import NotFoundImg from '../../assets/img/404NotFound.png';
import './LogoutPopUpComponent.css';

export const LogoutPopUpComponent = () => {
  return (
    <div className="logout-modal-container">
      <img src={NotFoundImg} alt="Sesión cerrada" className="logout-modal-image" />
      <h3 className="logout-modal-title">Sesión Cerrada Por Inactividad</h3>
    </div>
  );
}
