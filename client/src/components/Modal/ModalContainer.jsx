import React, { useEffect, useState } from 'react';
import '../../styles/ModalContainer.css';
import { Login } from '../../pages/Login';
import { Register } from '../../pages/Register';
import { ConstructionComponent } from '../constructionComponent/constructionComponent';
import { LogoutPopUpComponent } from '../LogoutPopUpComponent/LogoutPopUpComponent';

export const ModalContainer = ({ type, visible, onClose, onSwitch, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && visible && !isProcessing) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [visible, onClose, isProcessing]);

  const handleSuccess = async (data) => {
    setIsProcessing(true);
    try {
      await onSuccess(data);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Sincronizando carrito...</p>
          <div className="spinner" style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            margin: '1rem auto',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      );
    }
    if (type === 'login') return <Login onSwitch={onSwitch} onSuccess={handleSuccess} />;
    if (type === 'register') return <Register onSwitch={onSwitch} onSuccess={handleSuccess} />;
    if (type === 'construction') return <ConstructionComponent />;
    if (type === 'logout') return <LogoutPopUpComponent />;
    return null;
  };

  return (
    <div className="cf-modal-overlay" onMouseDown={!isProcessing ? onClose : undefined}>
      <div className="cf-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {!isProcessing && <button className="cf-modal-close" onClick={onClose} aria-label="Cerrar">×</button>}
        <div className="cf-modal-content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default ModalContainer;
