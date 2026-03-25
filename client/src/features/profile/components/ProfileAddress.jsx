import { useState } from "react";
import { useProfileForm } from "../hooks";
import "./Profile/Profile.css";

export const ProfileAddress = () => {
  const {
    form,
    formErrors,
    isLoading,
    error,
    updateField,
    submit,
    clearError,
  } = useProfileForm();

  const [success, setSuccess] = useState("");
  const [localError, setLocalError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setLocalError("");
    clearError();

    const result = await submit();

    if (result?.success === false) {
      setLocalError(result?.error || "No se pudo guardar la dirección");
      return;
    }

    setSuccess("Dirección guardada exitosamente");
  };

  const displayError = localError || error;

  return (
    <section className="profile-card">
      <div className="section-header">
        <h2 className="section-title">Mi Dirección Predeterminada</h2>
      </div>

      <p style={{ marginBottom: "1rem", color: "#666", fontSize: "14px" }}>
        Esta dirección se utilizará para autocompletar el formulario de envío en
        futuras compras.
      </p>

      {displayError && <div className="profile-error">{displayError}</div>}
      {success && <div className="profile-success">{success}</div>}

      <form onSubmit={handleSubmit} className="address-form">
        <div className="address-form-row two-cols">
          <div>
            <label htmlFor="defaultCountry">País / Región *</label>
            <select
              id="defaultCountry"
              name="defaultCountry"
              value={form.defaultCountry}
              onChange={handleChange}
              required
              disabled={isLoading}
            >
              <option value="">Seleccionar país</option>
              <option value="Argentina">Argentina</option>
              <option value="Colombia">Colombia</option>
              <option value="Chile">Chile</option>
              <option value="Perú">Perú</option>
              <option value="México">México</option>
            </select>
            {formErrors.defaultCountry && (
              <span className="field-error">{formErrors.defaultCountry}</span>
            )}
          </div>

          <div>
            <label htmlFor="defaultPhone">Teléfono *</label>
            <input
              id="defaultPhone"
              type="tel"
              name="defaultPhone"
              value={form.defaultPhone}
              onChange={handleChange}
              placeholder="+57 300 123 4567"
              required
              disabled={isLoading}
              autoComplete="tel"
            />
            {formErrors.defaultPhone && (
              <span className="field-error">{formErrors.defaultPhone}</span>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="defaultAddress">Dirección *</label>
          <input
            id="defaultAddress"
            type="text"
            name="defaultAddress"
            value={form.defaultAddress}
            onChange={handleChange}
            placeholder="Calle 123 #45-67"
            required
            disabled={isLoading}
            autoComplete="address-line1"
          />
          {formErrors.defaultAddress && (
            <span className="field-error">{formErrors.defaultAddress}</span>
          )}
        </div>

        <div>
          <label htmlFor="defaultAddress2">
            Apartamento, suite, etc. (opcional)
          </label>
          <input
            id="defaultAddress2"
            type="text"
            name="defaultAddress2"
            value={form.defaultAddress2}
            onChange={handleChange}
            placeholder="Apto 301"
            disabled={isLoading}
            autoComplete="address-line2"
          />
        </div>

        <div className="address-form-row three-cols">
          <div>
            <label htmlFor="defaultZip">Código postal *</label>
            <input
              id="defaultZip"
              type="text"
              name="defaultZip"
              value={form.defaultZip}
              onChange={handleChange}
              placeholder="110111"
              required
              disabled={isLoading}
              autoComplete="postal-code"
            />
            {formErrors.defaultZip && (
              <span className="field-error">{formErrors.defaultZip}</span>
            )}
          </div>

          <div>
            <label htmlFor="defaultCity">Ciudad *</label>
            <input
              id="defaultCity"
              type="text"
              name="defaultCity"
              value={form.defaultCity}
              onChange={handleChange}
              placeholder="Bogotá"
              required
              disabled={isLoading}
              autoComplete="address-level2"
            />
            {formErrors.defaultCity && (
              <span className="field-error">{formErrors.defaultCity}</span>
            )}
          </div>

          <div>
            <label htmlFor="defaultState">Provincia / Estado *</label>
            <input
              id="defaultState"
              type="text"
              name="defaultState"
              value={form.defaultState}
              onChange={handleChange}
              placeholder="Cundinamarca"
              required
              disabled={isLoading}
              autoComplete="address-level1"
            />
            {formErrors.defaultState && (
              <span className="field-error">{formErrors.defaultState}</span>
            )}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Dirección"}
        </button>
      </form>
    </section>
  );
};
