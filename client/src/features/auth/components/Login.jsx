import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import "../../styles/Auth.css";
import logo from "../../assets/img/Group.svg";

export const Login = ({ onSwitch, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Usa el servicio centralizado
      const { data } = await api.auth.login({ email, password });

      // Validar respuesta
      if (data?.token) {
        // Guardar token y usuario en sessionStorage
        sessionStorage.setItem("authToken", data.token);
        sessionStorage.setItem("authUser", JSON.stringify(data.user));

        // Disparar evento para actualizar el estado global
        window.dispatchEvent(new Event("authChanged"));

        // Llamar onSuccess si fue pasado (cierra modal)
        if (typeof onSuccess === "function") {
          return onSuccess(data);
        }

        //Redirigir al home
        window.location.replace("/");
      } else {
        throw new Error("Respuesta de login inválida");
      }
    } catch (error) {
      console.error("Error en login:", error);

      // Mostrar mensaje de error al usuario
      const errorMessage = error?.message || "Error al iniciar sesión";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <div className="auth-header">
          <h2>Iniciar sesión</h2>
          <img src={logo} alt="CatFecito" className="auth-logo" />
        </div>

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
