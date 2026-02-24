import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/stores/authStore";
import "./Header.css";
import group from "../../../assets/img/Group.svg";
import user from "../../../assets/img/user.svg";
import logoutIcon from "../../../assets/img/logout.svg";

export const UserHeader = () => {
  const navigate = useNavigate();

  // Usa el store de Zustand
  const { user: currentUser, isAuthenticated, logout } = useAuthStore();

  const handleNavigateToHome = () => {
    navigate("/");
  };

  const handleNavigateToProducts = () => {
    navigate("/products");
  };

  const handleLogout = () => {
    // Llama al método logout del store
    // (limpia estado, sessionStorage, y redirige)
    logout();
  };

  const handleProfileClick = () => {
    // Si no está autenticado, ir a login
    if (!isAuthenticated) {
      return navigate("/login");
    }

    //Navegar según el rol del usuario (desde el store)
    const role = currentUser?.role;
    navigate(role === "admin" ? "/admin" : "/profile");
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
