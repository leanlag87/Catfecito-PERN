import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import process from "process";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      //  DESARROLLO: Desactivar PWA para evitar regeneración constante
      //  PRODUCCIÓN: Cambiar a false o comentar esta línea
      disable: process.env.NODE_ENV === "development",
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "ios/180.png", // Apple Touch Icon
        "android/android-launchericon-192-192.png",
        "android/android-launchericon-512-512.png",
      ],
      manifest: {
        name: "CatFecito - Tienda de Café Premium",
        short_name: "CatFecito",
        description: "Tienda online de café premium argentino",
        theme_color: "#8B4513",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait-primary",
        icons: [
          // Android
          {
            src: "/android/android-launchericon-48-48.png",
            sizes: "48x48",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/android/android-launchericon-72-72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/android/android-launchericon-96-96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/android/android-launchericon-144-144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/android/android-launchericon-192-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/android/android-launchericon-512-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          // iOS
          {
            src: "/ios/180.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "apple touch icon",
          },
          {
            src: "/ios/192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/ios/512.png",
            sizes: "512x512",
            type: "image/png",
          },
          // Windows
          {
            src: "/windows11/Square44x44Logo.scale-100.png",
            sizes: "44x44",
            type: "image/png",
          },
          {
            src: "/windows11/Square150x150Logo.scale-100.png",
            sizes: "150x150",
            type: "image/png",
          },
          {
            src: "/windows11/Square310x310Logo.scale-100.png",
            sizes: "310x310",
            type: "image/png",
          },
        ],
        categories: ["shopping", "food"],
        shortcuts: [
          {
            name: "Ver Productos",
            short_name: "Productos",
            description: "Ver catálogo de productos",
            url: "/products",
            icons: [
              {
                src: "/android/android-launchericon-192-192.png",
                sizes: "192x192",
              },
            ],
          },
          {
            name: "Mi Carrito",
            short_name: "Carrito",
            description: "Ver carrito de compras",
            url: "/cart",
            icons: [
              {
                src: "/android/android-launchericon-192-192.png",
                sizes: "192x192",
              },
            ],
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/.*$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hora
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
            },
          },
        ],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },
      // DESARROLLO: Mantener enabled: true para probar PWA localmente
      // PRODUCCIÓN: Ya está configurado correctamente (se activa automáticamente en build)
      devOptions: {
        enabled: true, // Cambiar a false si no quieres PWA en dev
        type: "module",
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  preview: {
    host: true,
  },
});
