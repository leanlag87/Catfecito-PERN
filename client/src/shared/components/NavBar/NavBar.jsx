import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModalContainer } from "../Modal/ModalContainer";
import { useBodyScrollLock, useClickOutside, useEscapeKey } from "../../hooks";
import { ROUTES } from "../../constants";
import "./NavBar.css";

const PRODUCTS_ROUTE = ROUTES.SHOP || "/products";
const CONTACT_ROUTE = "/contact";

export const NavBar = () => {
  const navigate = useNavigate();
  const navRef = useRef(null);

  const [showConstructionModal, setShowConstructionModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useBodyScrollLock(menuOpen);
  useClickOutside(navRef, () => setMenuOpen(false), menuOpen);
  useEscapeKey(() => setMenuOpen(false), menuOpen);

  const closeMenu = () => setMenuOpen(false);

  const goTo = (path) => {
    closeMenu();
    navigate(path);
  };

  const openConstruction = () => {
    closeMenu();
    setShowConstructionModal(true);
  };

  const navItems = [
    { label: "Café en grano", action: () => goTo(PRODUCTS_ROUTE) },
    { label: "Cápsulas", action: openConstruction },
    { label: "Cafeteras y accesorios", action: openConstruction },
    { label: "Ofertas", action: openConstruction },
    { label: "Contacto", action: () => goTo(CONTACT_ROUTE) },
  ];

  return (
    <>
      <nav className="navbar" ref={navRef}>
        <div className="navbar-items">
          {navItems.map((item) => (
            <button key={item.label} onClick={item.action} className="button">
              {item.label}
            </button>
          ))}
        </div>

        <button
          className="navbar-hamburger"
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={`hamburger ${menuOpen ? "open" : ""}`} />
        </button>

        <div
          id="mobile-menu"
          className={`navbar-mobile-menu ${menuOpen ? "open" : "closed"}`}
          role="menu"
          aria-hidden={!menuOpen}
        >
          {navItems.map((item) => (
            <button
              key={`mobile-${item.label}`}
              onClick={item.action}
              className="mobile-button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <ModalContainer
        type="construction"
        visible={showConstructionModal}
        onClose={() => setShowConstructionModal(false)}
      />
    </>
  );
};
