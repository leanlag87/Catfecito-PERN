import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/stores/authStore";
import { ROUTES } from "../../constants";
import "../Header/Header.css";
import group from "../../../assets/img/Group.svg";
import user from "../../../assets/img/user.svg";
import logoutIcon from "../../../assets/img/logout.svg";

const SHOP_ROUTE = ROUTES.SHOP || "/products";

export const UserHeader = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, logout } = useAuthStore();

  const handleNavigateToHome = () => navigate(ROUTES.HOME);
  const handleNavigateToProducts = () => navigate(SHOP_ROUTE);
  const handleLogout = () => logout();

  const handleProfileClick = () => {
    if (!isAuthenticated) return navigate(ROUTES.LOGIN);
    navigate(currentUser?.role === "admin" ? ROUTES.ADMIN : ROUTES.PROFILE);
  };

  return (
    <div className="header">
      <div className="left-group">
        <div className="logo-container" onClick={handleNavigateToHome}>
          <img src={group} alt="Catfecito logo" />
        </div>

        <button
          type="button"
          className="shop-button"
          onClick={handleNavigateToProducts}
          aria-label="Volver a la tienda"
        >
          Shop
        </button>
      </div>

      <div className="user-icons">
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
      </div>
    </div>
  );
};
