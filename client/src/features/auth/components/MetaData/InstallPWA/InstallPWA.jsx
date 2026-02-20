import { useState, useEffect } from "react";
import "./InstallPWA.css";

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevenir que Chrome muestre el prompt automático
      e.preventDefault();

      // Guardar el evento para usarlo después
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt de instalación
    deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;

    console.log(
      `Usuario ${outcome === "accepted" ? "aceptó" : "rechazó"} instalar PWA`,
    );

    // Limpiar el prompt
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    // Guardar en localStorage para no mostrar por 7 días
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Verificar si el usuario ya rechazó la instalación recientemente
  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const daysSinceDismissed =
        (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowInstall(false);
      }
    }
  }, []);

  if (!showInstall) return null;

  return (
    <div className="install-pwa-banner">
      <div className="install-pwa-content">
        <div className="install-pwa-icon">📱</div>
        <div className="install-pwa-text">
          <strong>Instala CatFecito</strong>
          <p>Accede más rápido desde tu pantalla de inicio</p>
        </div>
        <div className="install-pwa-actions">
          <button onClick={handleInstallClick} className="btn-install">
            Instalar
          </button>
          <button onClick={handleDismiss} className="btn-dismiss">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
