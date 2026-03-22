import { useRef, useState } from "react";
import "./ModalContainer.css";
import { Login } from "../../../features/auth/components/Login";
import { Register } from "../../../features/auth/components/Register";
import { LogoutPopUpComponent } from "../../../features/auth/components/LogoutPopUp/LogoutPopUpComponent";
import { ConstructionComponent } from "../Construction/ConstructionComponent";
import { useBodyScrollLock, useClickOutside, useEscapeKey } from "../../hooks";
import { MODAL_CLOSE_REASONS } from "../../constants";

export const ModalContainer = ({
  type,
  visible,
  onClose,
  onSwitch,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const modalRef = useRef(null);

  useBodyScrollLock(visible);

  const requestClose = (reason) => {
    if (isProcessing || !visible) return;
    onClose?.(reason);
  };

  useEscapeKey(
    () => requestClose(MODAL_CLOSE_REASONS.ESCAPE),
    visible && !isProcessing,
  );

  useClickOutside(
    modalRef,
    () => requestClose(MODAL_CLOSE_REASONS.BACKDROP),
    visible && !isProcessing,
  );

  const handleSuccess = async (data) => {
    if (typeof onSuccess !== "function") return;
    setIsProcessing(true);
    try {
      await onSuccess(data);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Sincronizando carrito...</p>
          <div
            className="spinner"
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              margin: "1rem auto",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      );
    }

    if (type === "login") {
      return <Login onSwitch={onSwitch} onSuccess={handleSuccess} />;
    }

    if (type === "register") {
      return <Register onSwitch={onSwitch} onSuccess={handleSuccess} />;
    }

    if (type === "construction") {
      return <ConstructionComponent />;
    }

    if (type === "logout") {
      return <LogoutPopUpComponent />;
    }

    return null;
  };

  return (
    <div className="cf-modal-overlay">
      <div ref={modalRef} className="cf-modal" role="dialog" aria-modal="true">
        {!isProcessing && (
          <button
            className="cf-modal-close"
            onClick={() => requestClose(MODAL_CLOSE_REASONS.CLOSE_BUTTON)}
            aria-label="Cerrar"
          >
            ×
          </button>
        )}

        <div className="cf-modal-content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default ModalContainer;
