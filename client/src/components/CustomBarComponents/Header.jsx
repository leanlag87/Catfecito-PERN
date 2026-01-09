import React, { useState, useEffect, useCallback, useRef } from "react";
import "./Header.css";
import group from "../../assets/img/Group.svg";
import searchIcon from "../../assets/img/lupa.png";
import user from "../../assets/img/user.svg";
import cart from "../../assets/img/cart.svg";
import { Cart } from "../../pages/Cart";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import logout from "../../assets/img/logout.svg";
import { debounce } from 'lodash'; // Necesitarás instalar lodash: npm install lodash

export const Header = ({
  cartItems = [],
  itemCount = 0,
  isCartOpen = false,
  onOpenCart = () => {},
  onCloseCart = () => {},
  onUpdateQuantity = () => {},
  onRemoveItem = () => {},
  onOpenAuthModal = null
}) => {

  const [isLogged, setIsLogged] = useState(!!sessionStorage.getItem('authToken'));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '') : '';

  //traemos imagenes de los items para el buscador
  const getItemImageSrc = (it) => {
    if (!it) return '';
    let v = it.image ?? it.image_url ?? '';
    // Si es un objeto con propiedad url
    if (v && typeof v === 'object' && typeof v.url === 'string') {
      v = v.url;
    }
    if (typeof v !== 'string') return '';
    const src = v.trim();
    if (!src) return '';
    // Aceptar URLs absolutas y data URLs
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    // Asegurarse de que BACKEND_ORIGIN exista antes de la concatenación
    if (!BACKEND_ORIGIN) return src;
    return `${BACKEND_ORIGIN}${src.startsWith('/') ? '' : '/'}${src}`;
  };

  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Hook para gestionar el estado de login
  useEffect(() => {
    const onStorage = () => setIsLogged(!!sessionStorage.getItem('authToken'));
    const onAuthChanged = () => setIsLogged(!!sessionStorage.getItem('authToken'));
    window.addEventListener('storage', onStorage);
    window.addEventListener('authChanged', onAuthChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('authChanged', onAuthChanged);
    };
  }, []);

  const handleNavigateToHome = () => {
    navigate('/');
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
      setIsLogged(false);
      navigate('/');
    }
  };

  const resolveUserRole = () => {
    try {
      const stored = sessionStorage.getItem('authUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role) return parsed.role;
      }
    } catch { /* noop */ }

    const token = sessionStorage.getItem('authToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return payload?.role || null;
    } catch {
      return null;
    }
  };
  
  // Función de búsqueda con debounce
  const performSearch = async (query) => {
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      // Trae todos los productos activos
      const { data } = await api.get('/products');
      // data.products porque tu backend responde { success, count, products }
      const products = data.products || [];
      // Normaliza y filtra por nombre o categoría
      const normalize = (str) =>
        (str || "")
          .toString()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();
      const q = normalize(query);
      const filtered = products.filter(
        (p) =>
          normalize(p.name).includes(q) ||
          normalize(p.category_name).includes(q)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error al buscar productos:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Usamos useCallback para memorizar la función debounced
  const debouncedSearch = useCallback(debounce(performSearch, 300), []);

  useEffect(() => {
    debouncedSearch(searchQuery);
    // Cancelar el debounce si el componente se desmonta
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);


  return (
    <div className="header">
      <div className={`logo-container`} onClick={handleNavigateToHome}>
        <img src={group} alt="Catfecito logo" />
      </div>
      <div className={`searcher ${mobileSearchOpen ? 'visible' : ''}`}>
        <input
          ref={inputRef}
          className="search-rec"
          type="search"
          placeholder="¿Qué café estás buscando?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {/* Mobile hint: visible only on small screens when input is empty. Click focuses input. */}
        <span
          className={`mobile-search-hint ${searchQuery ? 'hidden' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (inputRef.current) inputRef.current.focus();
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') { if (inputRef.current) inputRef.current.focus(); } }}
        >
        </span>
        <button
          type="button"
          className="clear-search"
          onClick={() => setSearchQuery('')}
          aria-label="Limpiar búsqueda"
          style={{ display: searchQuery ? 'flex' : 'none' }}
        >
          ×
        </button>

        <button
          className="search-icon"
          onClick={() => {
            const q = (searchQuery || '').trim();
            if (!q) return;
            navigate(`/products?search=${encodeURIComponent(q)}`);
            setSearchResults([]);
          }}
        >
          <img src={searchIcon} alt="Buscar" />
        </button>

        {/* Dropdown de resultados de búsqueda */}
        <div className={`search-results ${ (isSearching || searchResults.length > 0 || searchQuery) ? 'visible' : '' }`}>
          {isSearching ? (
            <div className="no-results">Buscando...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((p) => (
              <button
                key={p.id}
                className="search-result-item"
                type="button"
                onClick={() => {
                  const q = (p.name || '').trim();
                  if (q) {
                    setSearchQuery('');
                    setSearchResults([]);
                    navigate(`/products?search=${encodeURIComponent(q)}`);
                  }
                }}
              >
                <img src={getItemImageSrc(p)} alt={p.name} />
                <div className="sr-info">
                  <div className="sr-name">{p.name}</div>
                  <div className="sr-price">${Number(p.price || 0).toFixed(2)}</div>
                </div>
              </button>
            ))
          ) : (
             searchQuery && !isSearching && <div className="no-results">No se encontraron productos</div>
          )}
        </div>
      </div>
      
      <div className="user-icons">
        {/* Mobile: search toggle shown beside other icons */}
        <button
          type="button"
          className="mobile-search-toggle"
          aria-label="Buscar"
          aria-expanded={mobileSearchOpen}
          onClick={() => {
            const next = !mobileSearchOpen;
            setMobileSearchOpen(next);
            // focus input when opening
            if (next && inputRef.current) setTimeout(() => inputRef.current.focus(), 50);
          }}
        >
          <img src={searchIcon} alt="Buscar" />
        </button>
        <button
          type="button"
          className="profile-button"
          onClick={() => {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
              if (typeof onOpenAuthModal === 'function') {
                onOpenAuthModal('login');
                return;
              }
              navigate('/login', { state: { from: window.location.pathname, background: { pathname: window.location.pathname } } });
              return;
            }
            const role = resolveUserRole();
            if (role === 'admin') navigate('/admin');
            else navigate('/profile');
          }}
        >
          <img className="user" src={user} alt="Usuario" />
        </button>

        {isLogged && (
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <img className="log-out" src={logout} alt="Cerrar sesión" />
          </button>
        )}
        
        <button type="button" className="cart-button" onClick={onOpenCart}>
          <img className="cart" src={cart} alt="Carrito" />
          {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
        </button>
      </div>

      <Cart 
        isOpen={isCartOpen}
        onClose={onCloseCart}
        cartItems={cartItems}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
      />
    </div>
  );
};