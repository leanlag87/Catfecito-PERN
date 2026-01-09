import React, { useState, useRef, useEffect } from "react";
import "./NavBar.css";
import { useNavigate } from "react-router-dom";
import { ModalContainer } from "../Modal/ModalContainer";

export const NavBar = () => {
  const navigate = useNavigate();
  const [showConstructionModal, setShowConstructionModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  const handleNavigateToProducts = () => {
    console.log('Navegando a products...');
    navigate('/products');
    console.log('Navigate ejecutado');
  };

  const handleShowConstruction = () => {
    setShowConstructionModal(true);
  };

  const handleCloseModal = () => {
    setShowConstructionModal(false);
  };

  const toggleMenu = () => setMenuOpen(v => !v);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;

    const onDocumentClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onKeyDown);

    // prevent body scroll when menu is open on mobile
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <>
  <nav className="navbar" ref={navRef}>
        {/* Desktop / tablet horizontal nav */}
        <div className="navbar-items">
          <button onClick={handleNavigateToProducts} className="button">Café en grano</button>
          <button onClick={handleShowConstruction} className="button">Cápsulas</button>
          <button onClick={handleShowConstruction} className="button">Cafeteras y accesorios</button>
          <button onClick={handleShowConstruction} className="button">Ofertas</button>
          <button onClick={() => navigate('/contact')} className="button">Contacto</button>
        </div>

        {/* Hamburger for mobile */}
        <button
          className="navbar-hamburger"
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={toggleMenu}
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
        </button>

        {/* Mobile menu: always rendered so CSS can animate open/close via classes */}
        <div
          id="mobile-menu"
          className={`navbar-mobile-menu ${menuOpen ? 'open' : 'closed'}`}
          role="menu"
          aria-hidden={!menuOpen}
        >
          <button onClick={() => { setMenuOpen(false); handleNavigateToProducts(); }} className="mobile-button">Café en grano</button>
          <button onClick={() => { setMenuOpen(false); handleShowConstruction(); }} className="mobile-button">Cápsulas</button>
          <button onClick={() => { setMenuOpen(false); handleShowConstruction(); }} className="mobile-button">Cafeteras y accesorios</button>
          <button onClick={() => { setMenuOpen(false); handleShowConstruction(); }} className="mobile-button">Ofertas</button>
          <button onClick={() => { setMenuOpen(false); navigate('/contact'); }} className="mobile-button">Contacto</button>
        </div>
      </nav>

      
      <ModalContainer 
        type="construction"
        visible={showConstructionModal}
        onClose={handleCloseModal}
      />
    </>
  );
};
