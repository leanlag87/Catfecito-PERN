import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/stores/authStore";
import { useProfileStore } from "../stores/profileStore";
import "./Profile/Profile.css";

export default function ProfileAddress() {
  const navigate = useNavigate();

  const { isAuthenticated } = useAuthStore();
  const {
    profile,
    updateProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfileStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    default_country: "",
    default_address: "",
    default_address2: "",
    default_city: "",
    default_state: "",
    default_zip: "",
    default_phone: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        default_country: profile.default_country || "",
        default_address: profile.default_address || "",
        default_address2: profile.default_address2 || "",
        default_city: profile.default_city || "",
        default_state: profile.default_state || "",
        default_zip: profile.default_zip || "",
        default_phone: profile.default_phone || "",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const result = await updateProfile(formData);

    if (result.success) {
      setSuccess("Dirección guardada exitosamente");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const displayError = error || profileError;

  if (profileLoading && !profile) {
    return (
      <section className="profile-card">
        <p>Cargando dirección...</p>
      </section>
    );
  }

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
            <label htmlFor="default_country">País / Región *</label>
            <select
              id="default_country"
              name="default_country"
              value={formData.default_country}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Seleccionar país</option>
              <option value="Argentina">Argentina</option>
              <option value="Colombia">Colombia</option>
              <option value="Chile">Chile</option>
              <option value="Perú">Perú</option>
              <option value="México">México</option>
            </select>
          </div>
          <div>
            <label htmlFor="default_phone">Teléfono *</label>
            <input
              id="default_phone"
              type="tel"
              name="default_phone"
              value={formData.default_phone}
              onChange={handleChange}
              placeholder="+57 300 123 4567"
              required
              disabled={loading}
              autoComplete="tel"
            />
          </div>
        </div>

        <div>
          <label htmlFor="default_address">Dirección *</label>
          <input
            id="default_address"
            type="text"
            name="default_address"
            value={formData.default_address}
            onChange={handleChange}
            placeholder="Calle 123 #45-67"
            required
            disabled={loading}
            autoComplete="address-line1"
          />
        </div>

        <div>
          <label htmlFor="default_address2">
            Apartamento, suite, etc. (opcional)
          </label>
          <input
            id="default_address2"
            type="text"
            name="default_address2"
            value={formData.default_address2}
            onChange={handleChange}
            placeholder="Apto 301"
            disabled={loading}
            autoComplete="address-line2"
          />
        </div>

        <div className="address-form-row three-cols">
          <div>
            <label htmlFor="default_zip">Código postal *</label>
            <input
              id="default_zip"
              type="text"
              name="default_zip"
              value={formData.default_zip}
              onChange={handleChange}
              placeholder="110111"
              required
              disabled={loading}
              autoComplete="postal-code"
            />
          </div>
          <div>
            <label htmlFor="default_city">Ciudad *</label>
            <input
              id="default_city"
              type="text"
              name="default_city"
              value={formData.default_city}
              onChange={handleChange}
              placeholder="Bogotá"
              required
              disabled={loading}
              autoComplete="address-level2"
            />
          </div>
          <div>
            <label htmlFor="default_state">Provincia / Estado *</label>
            <input
              id="default_state"
              type="text"
              name="default_state"
              value={formData.default_state}
              onChange={handleChange}
              placeholder="Cundinamarca"
              required
              disabled={loading}
              autoComplete="address-level1"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Dirección"}
        </button>
      </form>
    </section>
  );
}
