import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../constants";
import { getItem, setItem } from "../../utils";
import "./InstallPWA.css";

const DISMISS_DAYS = 7;
const DAY_MS = 1000 * 60 * 60 * 24;

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  const wasDismissedRecently = () => {
    const dismissedAt = Number(
      getItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED) || 0,
    );
    if (!dismissedAt) return false;
    const days = (Date.now() - dismissedAt) / DAY_MS;
    return days < DISMISS_DAYS;
  };

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;

    if (isStandalone || wasDismissedRecently()) {
      setShowInstall(false);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
      setItem(STORAGE_KEYS.PWA_INSTALL_LAST_PROMPT_AT, Date.now().toString());
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(
      `Usuario ${outcome === "accepted" ? "aceptó" : "rechazó"} instalar PWA`,
    );

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    setItem(STORAGE_KEYS.PWA_INSTALL_DISMISSED, Date.now().toString());
  };

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
