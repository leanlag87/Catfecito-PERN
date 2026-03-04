import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useAuthForm } from "../hooks/useAuthForm";
import "./Auth.css";
import logo from "../../../assets/img/Group.svg";

export const Login = ({ onSwitch, onSuccess }) => {
  const { login, isLoading, error: storeError, clearError } = useAuthStore();

  // Hook personalizado para manejar el formulario
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid,
  } = useAuthForm("login");

  const onSubmit = async (formattedData) => {
    // Limpiar errores previos del store
    clearError();

    // Llamar al login del store con datos formateados
    const result = await login(formattedData);

    if (result.success) {
      // Login exitoso
      if (typeof onSuccess === "function") {
        return onSuccess(result.data);
      }

      // Redirigir al home (recarga para sincronizar carrito)
      window.location.replace("/");
    } else {
      // Login fallido - el error ya está en el store
      console.error("Error en login:", result.error);
    }
  };

  return (
    <main className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="auth-header">
          <h2>Iniciar sesión</h2>
          <img src={logo} alt="CatFecito" className="auth-logo" />
        </div>

        {/* Error global del backend */}
        {storeError && <div className="auth-error">{storeError}</div>}

        {/* Email */}
        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="tu@email.com"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          autoComplete="email"
          disabled={isLoading}
          className={touched.email && errors.email ? "input-error" : ""}
        />
        {touched.email && errors.email && (
          <span className="field-error">{errors.email}</span>
        )}

        {/* Contraseña */}
        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="••••••••"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          autoComplete="current-password"
          disabled={isLoading}
          className={touched.password && errors.password ? "input-error" : ""}
        />
        {touched.password && errors.password && (
          <span className="field-error">{errors.password}</span>
        )}

        <button type="submit" disabled={isLoading || !isValid}>
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
