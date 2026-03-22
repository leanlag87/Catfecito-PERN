import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/stores/authStore";
import api from "../../../services/api";
import { Cart } from "../../../features/cart/components/Cart";
import { useDebouncedValue, useClickOutside, useEscapeKey } from "../../hooks";
import { ROUTES, UI_DURATIONS_MS } from "../../constants";
import {
  normalizeText,
  resolveImageUrl,
  formatCurrency,
  getErrorMessage,
} from "../../utils";
import "./Header.css";
import group from "../../../assets/img/Group.svg";
import searchIcon from "../../../assets/img/lupa.png";
import user from "../../../assets/img/user.svg";
import cart from "../../../assets/img/cart.svg";
import logoutIcon from "../../../assets/img/logout.svg";

const PRODUCTS_ROUTE = "/products";

export const Header = ({
  cartItems = [],
  itemCount = 0,
  isCartOpen = false,
  onOpenCart = () => {},
  onCloseCart = () => {},
  onUpdateQuantity = () => {},
  onRemoveItem = () => {},
  onOpenAuthModal = null,
}) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const { user: currentUser, isAuthenticated, logout } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const debouncedQuery = useDebouncedValue(
    searchQuery,
    UI_DURATIONS_MS.DEBOUNCE_SEARCH,
  );

  const handleNavigateToHome = () => navigate(ROUTES.HOME);
  const handleLogout = () => logout();

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      if (typeof onOpenAuthModal === "function") {
        onOpenAuthModal("login");
        return;
      }
      navigate(ROUTES.LOGIN, {
        state: {
          from: window.location.pathname,
          background: { pathname: window.location.pathname },
        },
      });
      return;
    }

    navigate(currentUser?.role === "admin" ? ROUTES.ADMIN : ROUTES.PROFILE);
  };

  const goToSearchPage = (value) => {
    const q = String(value || "").trim();
    if (!q) return;
    navigate(`${PRODUCTS_ROUTE}?search=${encodeURIComponent(q)}`);
    setSearchResults([]);
    setMobileSearchOpen(false);
  };

  const performSearch = useCallback(async (query) => {
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await api.products.getAll();
      const products = data?.products || [];
      const q = normalizeText(query);

      const filtered = products.filter((p) => {
        const name = normalizeText(p?.name);
        const category = normalizeText(p?.category_name);
        return name.includes(q) || category.includes(q);
      });

      setSearchResults(filtered);
    } catch (error) {
      console.error("Error al buscar productos:", getErrorMessage(error));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    performSearch(String(debouncedQuery || "").trim());
  }, [debouncedQuery, performSearch]);

  useClickOutside(
    searchContainerRef,
    () => {
      setSearchResults([]);
      if (!searchQuery) setMobileSearchOpen(false);
    },
    true,
  );

  useEscapeKey(
    () => {
      setSearchResults([]);
      setMobileSearchOpen(false);
      inputRef.current?.blur();
    },
    mobileSearchOpen || searchResults.length > 0,
  );

  return (
    <div className="header">
      <div className="logo-container" onClick={handleNavigateToHome}>
        <img src={group} alt="Catfecito logo" />
      </div>

      <div
        ref={searchContainerRef}
        className={`searcher ${mobileSearchOpen ? "visible" : ""}`}
      >
        <input
          ref={inputRef}
          className="search-rec"
          type="search"
          placeholder="¿Qué café estás buscando?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <span
          className={`mobile-search-hint ${searchQuery ? "hidden" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.focus()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.focus()}
        />

        <button
          type="button"
          className="clear-search"
          onClick={() => {
            setSearchQuery("");
            setSearchResults([]);
          }}
          aria-label="Limpiar búsqueda"
          style={{ display: searchQuery ? "flex" : "none" }}
        >
          ×
        </button>

        <button
          type="button"
          className="search-icon"
          onClick={() => goToSearchPage(searchQuery)}
        >
          <img src={searchIcon} alt="Buscar" />
        </button>

        <div
          className={`search-results ${
            isSearching || searchResults.length > 0 || searchQuery
              ? "visible"
              : ""
          }`}
        >
          {isSearching ? (
            <div className="no-results">Buscando...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((p) => (
              <button
                key={p.id}
                className="search-result-item"
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  goToSearchPage(p.name);
                }}
              >
                <img
                  src={resolveImageUrl(p, "/placeholder-product.jpg")}
                  alt={p.name}
                />
                <div className="sr-info">
                  <div className="sr-name">{p.name}</div>
                  <div className="sr-price">{formatCurrency(p.price)}</div>
                </div>
              </button>
            ))
          ) : (
            searchQuery &&
            !isSearching && (
              <div className="no-results">No se encontraron productos</div>
            )
          )}
        </div>
      </div>

      <div className="user-icons">
        <button
          type="button"
          className="mobile-search-toggle"
          aria-label="Buscar"
          aria-expanded={mobileSearchOpen}
          onClick={() => {
            const next = !mobileSearchOpen;
            setMobileSearchOpen(next);
            if (next) {
              window.setTimeout(
                () => inputRef.current?.focus(),
                UI_DURATIONS_MS.FAST,
              );
            }
          }}
        >
          <img src={searchIcon} alt="Buscar" />
        </button>

        <button
          type="button"
          className="profile-button"
          onClick={handleProfileClick}
          aria-label={isAuthenticated ? "Ver perfil" : "Iniciar sesión"}
        >
          <img className="user" src={user} alt="Usuario" />
        </button>

        {isAuthenticated && (
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <img className="log-out" src={logoutIcon} alt="Cerrar sesión" />
          </button>
        )}

        <button
          type="button"
          className="cart-button"
          onClick={onOpenCart}
          aria-label={`Carrito (${itemCount} items)`}
        >
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
