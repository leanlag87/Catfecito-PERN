import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Equivalente a --host 0.0.0.0 para desarrollo
  },
  build: {
    outDir: "dist", // Ya es el default, pero explícito está bien
    sourcemap: false, // Recomendado para producción (reduce tamaño)
  },
  preview: {
    host: true, // Para que preview también escuche en todas las interfaces
    // NO especificar port aquí - Railway lo asignará automáticamente
  },
});
