import { useAuthStore } from "../../stores/authStore";
import NotFoundImg from "../../../../assets/img/404NotFound.png";
import "./LogoutPopUpComponent.css";

export const LogoutPopUpComponent = () => {
  const { logout } = useAuthStore();
  return (
    <div className="logout-modal-container">
      <img
        src={NotFoundImg}
        alt="Sesión cerrada"
        className="logout-modal-image"
      />
      <h3 className="logout-modal-title">Sesión Cerrada Por Inactividad</h3>
      <button className="logout-modal-button" onClick={logout}>
        Ir al inicio
      </button>
    </div>
  );
};
