import React from 'react';
import NotFoundImg from '../../assets/img/404NotFound.png';
import './NotFoundComponent.css';

export const NotFoundComponent = () => {
  return (
    <div className="notfound-container">
      <img src={NotFoundImg} alt="404 Not Found" className="notfound-image" />
      <h1 className="notfound-title">404</h1>
      <h2 className="notfound-subtitle">CATFECITO NOT FOUND</h2>
    </div>
  );
}
