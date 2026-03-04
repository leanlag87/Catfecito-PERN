import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useAuthForm } from "../hooks/useAuthForm";
import "./Auth.css";
import logo from "../../../assets/img/Group.svg";

export const Register = ({ onSwitch, onSuccess }) => {
  const { register, isLoading, error: storeError, clearError } = useAuthStore();

  // Hook personalizado para manejar el formulario
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid,
  } = useAuthForm("register");

  const onSubmit = async (formattedData) => {
    // Limpiar errores previos del store
    clearError();

    // Combinar firstName y lastName en name (para tu backend)
    const dataToSend = {
      name: `${formattedData.firstName} ${formattedData.lastName}`.trim(),
      email: formattedData.email,
      password: formattedData.password,
    };

    // Llamar al register del store
    const result = await register(dataToSend);

    if (result.success) {
      // Registro exitoso
      if (typeof onSuccess === "function") {
        return onSuccess(result.data);
      }

      // Redirigir al home (recarga para sincronizar carrito)
      window.location.replace("/");
    } else {
      // Registro fallido - mostrar error del backend
      console.error("Error en registro:", result.error);
    }
  };

  return (
    <main className="auth-container-register">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="auth-header">
          <h2>Registrarse</h2>
          <img src={logo} alt="CatFecito" className="auth-logo" />
        </div>

        {/* Error global del backend */}
        {storeError && <div className="auth-error">{storeError}</div>}

        {/* Nombre */}
        <label htmlFor="firstName">Nombre</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={values.firstName}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          autoComplete="given-name"
          disabled={isLoading}
          className={touched.firstName && errors.firstName ? "input-error" : ""}
        />
        {touched.firstName && errors.firstName && (
          <span className="field-error">{errors.firstName}</span>
        )}

        {/* Apellido */}
        <label htmlFor="lastName">Apellido</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={values.lastName}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          autoComplete="family-name"
          disabled={isLoading}
          className={touched.lastName && errors.lastName ? "input-error" : ""}
        />
        {touched.lastName && errors.lastName && (
          <span className="field-error">{errors.lastName}</span>
        )}

        {/* Email */}
        <label htmlFor="email">Correo</label>
        <input
          type="email"
          id="email"
          name="email"
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
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          autoComplete="new-password"
          disabled={isLoading}
          minLength={6}
          className={touched.password && errors.password ? "input-error" : ""}
        />
        {touched.password && errors.password && (
          <span className="field-error">{errors.password}</span>
        )}

        <button type="submit" disabled={isLoading || !isValid}>
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
