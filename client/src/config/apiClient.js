import axios from "axios";

// Base URL desde variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 📤 REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
  (config) => {
    // Agregar token JWT si existe
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.log(
        `→ ${config.method.toUpperCase()} ${config.url}`,
        config.data || "",
      );
    }

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  },
);

// 📥 RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => {
    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.log(`← ${response.status} ${response.config.url}`, response.data);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el token expiró (401) y no es retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar refrescar el token
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const { data } = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            {
              refreshToken,
            },
          );

          // Guardar nuevo token
          localStorage.setItem("token", data.token);

          // Reintentar request original
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Si falla el refresh, logout
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Manejo de errores comunes
    const errorMessage =
      error.response?.data?.message || error.message || "Error desconocido";

    console.error(`Response Error [${error.response?.status}]:`, errorMessage);

    // Retornar error formateado
    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });
  },
);

export default apiClient;
