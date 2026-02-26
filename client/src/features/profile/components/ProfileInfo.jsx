import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/stores/authStore";
import { useProfileStore } from "../stores/profileStore";
import api from "../../../services/api";
import "./Profile.css";

export default function ProfileInfo() {
  const navigate = useNavigate();

  const { isAuthenticated, logout } = useAuthStore();
  const { profile, isLoading, error: profileError } = useProfileStore();

  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    try {
      const { data } = await api.put("/users/change-password", {
        currentPassword,
        newPassword,
      });

      alert(data?.message || "Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e?.response?.data?.message || "Error al cambiar la contraseña");
    }
  };

  const handleLogout = () => {
    logout();
  };

  const displayError = error || profileError;

  if (isLoading) {
    return (
      <section className="profile-card">
        <p>Cargando perfil...</p>
      </section>
    );
  }

  return (
    <>
      <section className="profile-card">
        {displayError && <div className="profile-error">{displayError}</div>}
        {profile ? (
          <div className="profile-fields">
            <div className="field">
              <div className="field-label">Nombre</div>
              <div className="field-value">{profile.name}</div>
            </div>
            <div className="field">
              <div className="field-label">Correo electrónico</div>
              <div className="field-value">{profile.email}</div>
            </div>
          </div>
        ) : (
          <p>No se pudo cargar el perfil.</p>
        )}
      </section>

      <section className="profile-card">
        <div className="section-header">
          <h2 className="section-title">Seguridad</h2>
        </div>
        <form className="password-form" onSubmit={handleChangePassword}>
          <label>Contraseña actual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <label>Nueva contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <label>Confirmar nueva contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <button type="submit" className="btn-primary">
            Actualizar contraseña
          </button>
        </form>
        <div className="cerrar-sesion-row">
          <button type="button" className="btn-danger" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </>
  );
}
