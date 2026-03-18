import { useState } from "react";
import { useAuthStore } from "../../auth/stores/authStore";
import { useProfile, useProfileSecurity } from "../hooks";
import "./Profile/Profile.css";

export default function ProfileInfo() {
  const { logout } = useAuthStore();
  const {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
    fullName,
  } = useProfile();

  const {
    form,
    formErrors,
    isLoading: isSecurityLoading,
    error: securityError,
    updateField,
    submitPasswordChange,
    resetForm,
    clearError,
  } = useProfileSecurity();

  const [localError, setLocalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMsg("");
    clearError();

    const result = await submitPasswordChange();

    if (result?.success === false) {
      setLocalError(result?.error || "Error al cambiar la contraseña");
      return;
    }

    setSuccessMsg("Contraseña actualizada correctamente");
    resetForm();
  };

  const handleLogout = () => logout();

  const displayError = localError || securityError || profileError;

  if (isProfileLoading) {
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
        {successMsg && <div className="profile-success">{successMsg}</div>}

        {profile ? (
          <div className="profile-fields">
            <div className="field">
              <div className="field-label">Nombre</div>
              <div className="field-value">{fullName || profile.name}</div>
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
            value={form.currentPassword}
            onChange={(e) => updateField("currentPassword", e.target.value)}
            required
            autoComplete="current-password"
          />
          {formErrors.currentPassword && (
            <span className="field-error">{formErrors.currentPassword}</span>
          )}

          <label>Nueva contraseña</label>
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => updateField("newPassword", e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          {formErrors.newPassword && (
            <span className="field-error">{formErrors.newPassword}</span>
          )}

          <label>Confirmar nueva contraseña</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          {formErrors.confirmPassword && (
            <span className="field-error">{formErrors.confirmPassword}</span>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isSecurityLoading}
          >
            {isSecurityLoading ? "Actualizando..." : "Actualizar contraseña"}
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
