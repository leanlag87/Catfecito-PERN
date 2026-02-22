import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import "..Auth.css";
import logo from "../../assets/img/Group.svg";

export const Register = ({ onSwitch, onSuccess }) => {
  const [firstName, setFirstname] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleRegister = async (e) => {
    e.preventDefault();

    // Limpia errores previos
    clearError();

    // Combinar nombre y apellido
    const name = `${firstName} ${lastName}`.trim();

    // Llama al método register del store
    const result = await register({ name, email, password });

    if (result.success) {
      // Registro exitoso
      if (typeof onSuccess === "function") {
        return onSuccess(result.data);
      }

      // Redirigir al home (recarga para sincronizar carrito)
      window.location.replace("/");
    } else {
      // Registro fallido - el error viene del store
      alert(result.error);
    }
  };

  return (
    <main className="auth-container-register">
      <form className="auth-form" onSubmit={handleRegister}>
        <div className="auth-header">
          <h2>Registrarse</h2>
          <img src={logo} alt="CatFecito" className="auth-logo" />
        </div>

        {/* Mostrar error si existe */}
        {error && <div className="auth-error">{error}</div>}

        <label htmlFor="firstName">Nombre</label>
        <input
          type="text"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstname(e.target.value)}
          required
          autoComplete="given-name"
          disabled={isLoading}
        />

        <label htmlFor="lastName">Apellido</label>
        <input
          type="text"
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          autoComplete="family-name"
          disabled={isLoading}
        />

        <label htmlFor="email">Correo</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={isLoading}
        />

        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={isLoading}
          minLength={6}
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p>
          ¿Ya tenés cuenta?{" "}
          {onSwitch ? (
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => onSwitch("login")}
              disabled={isLoading}
            >
              Ingresar
            </button>
          ) : (
            <Link to="/login">Ingresar</Link>
          )}
        </p>
      </form>
    </main>
  );
};
