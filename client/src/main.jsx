//import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);

// Registrar Service Worker (PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("PWA: Service Worker registrado", registration.scope);
      })
      .catch((error) => {
        console.error("PWA: Error al registrar Service Worker", error);
      });
  });
}
