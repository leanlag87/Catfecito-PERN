import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { useAuthStore } from "../../../features/auth/stores/authStore";
import api from "../../../services/api";
import { Cart } from "../../../features/cart/components/Cart";
import "./Header.css";
import group from "../../../assets/img/Group.svg";
import searchIcon from "../../../assets/img/lupa.png";
import user from "../../../assets/img/user.svg";
import cart from "../../../assets/img/cart.svg";
import logoutIcon from "../../../assets/img/logout.svg";

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

  // Usa el store de Zustand
  const { user: currentUser, isAuthenticated, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")
    : "";

  const getItemImageSrc = (it) => {
    if (!it) return "";
    let v = it.image ?? it.image_url ?? "";
    if (v && typeof v === "object" && typeof v.url === "string") {
      v = v.url;
    }
    if (typeof v !== "string") return "";
    const src = v.trim();
    if (!src) return "";
    if (src.startsWith("http") || src.startsWith("data:")) return src;
    if (!BACKEND_ORIGIN) return src;
    return `${BACKEND_ORIGIN}${src.startsWith("/") ? "" : "/"}${src}`;
  };

  const handleNavigateToHome = () => {
    navigate("/");
  };

  const handleLogout = () => {
    logout();
  };

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      if (typeof onOpenAuthModal === "function") {
        return onOpenAuthModal("login");
      }
      return navigate("/login", {
        state: {
          from: window.location.pathname,
          background: { pathname: window.location.pathname },
        },
      });
    }

    const role = currentUser?.role;
    navigate(role === "admin" ? "/admin" : "/profile");
  };

  // useCallback para performSearch
  const performSearch = useCallback(async (query) => {
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await api.products.getAll();
      const products = data.products || [];
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
          normalize(p.category_name).includes(q),
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error("Error al buscar productos:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // useMemo para crear debounce
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    [performSearch],
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  return (
    <div className="header">
      <div className="logo-container" onClick={handleNavigateToHome}>
        <img src={group} alt="Catfecito logo" />
      </div>

      <div className={`searcher ${mobileSearchOpen ? "visible" : ""}`}>
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
          onKeyDown={(e) => {
            if (e.key === "Enter") inputRef.current?.focus();
          }}
        />

        <button
          type="button"
          className="clear-search"
          onClick={() => setSearchQuery("")}
          aria-label="Limpiar búsqueda"
          style={{ display: searchQuery ? "flex" : "none" }}
        >
          ×
        </button>

        <button
          className="search-icon"
          onClick={() => {
            const q = searchQuery.trim();
            if (!q) return;
            navigate(`/products?search=${encodeURIComponent(q)}`);
            setSearchResults([]);
          }}
        >
          <img src={searchIcon} alt="Buscar" />
        </button>

        <div
          className={`search-results ${isSearching || searchResults.length > 0 || searchQuery ? "visible" : ""}`}
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
                  const q = p.name.trim();
                  if (q) {
                    setSearchQuery("");
                    setSearchResults([]);
                    navigate(`/products?search=${encodeURIComponent(q)}`);
                  }
                }}
              >
                <img src={getItemImageSrc(p)} alt={p.name} />
                <div className="sr-info">
                  <div className="sr-name">{p.name}</div>
                  <div className="sr-price">
                    ${Number(p.price || 0).toFixed(2)}
                  </div>
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
            if (next && inputRef.current)
              setTimeout(() => inputRef.current.focus(), 50);
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
