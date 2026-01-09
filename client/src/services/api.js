import axios from 'axios';

// Obtener la URL base del backend desde variables de entorno
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL 
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '') 
  : '';

// Crear instancia de axios con configuración predeterminada
const api = axios.create({
  baseURL: BACKEND_URL ? `${BACKEND_URL}/api` : '/api',
  timeout: 10000, // 10 segundos timeout
});

// Interceptor para agregar token de autenticación a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Manejar Content-Type según el tipo de datos
    if (config.data instanceof FormData) {
      // FormData: dejar que axios/navegador establezca multipart/form-data
      delete config.headers['Content-Type'];
    } else if (config.data && typeof config.data === 'object') {
      // JSON: establecer application/json
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta (ej: token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authUser');
      window.dispatchEvent(new Event('authChanged'));
      // Redirigir a login si es necesario
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
