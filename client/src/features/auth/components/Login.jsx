import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import "../Auth.css";
import logo from "../../assets/img/Group.svg";

export const Login = ({ onSwitch, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Limpiar errores previos
    clearError();

    // Llama al método login del store
    const result = await login({ email, password });

    if (result.success) {
      // Login exitoso
      if (typeof onSuccess === "function") {
        return onSuccess(result.data);
      }

      // Redirigir al home
      window.location.replace("/");
    } else {
      // Login fallido - el error ya está en el store
      alert(result.error);
    }
  };

  return (
    <main className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <div className="auth-header">
          <h2>Iniciar sesión</h2>
          <img src={logo} alt="CatFecito" className="auth-logo" />
        </div>

        {/* Mostrar error si existe */}
        {error && <div className="auth-error">{error}</div>}

        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          placeholder="tu@email.com"
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
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Ingresando..." : "Ingresar"}
        </button>
        <p>
          ¿No tenés cuenta?{" "}
          {onSwitch ? (
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => onSwitch("register")}
              disabled={isLoading}
            >
              Registrate
            </button>
          ) : (
            <Link to="/register">Registrate</Link>
          )}
        </p>
      </form>
    </main>
  );
};
