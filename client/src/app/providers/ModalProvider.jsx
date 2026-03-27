import { useCallback, useMemo, useState } from "react";
import { ModalContext } from "./modalContext";

//Provider global para controlar modales de la app.
export const ModalProvider = ({ children }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("login");
  const [modalPayload, setModalPayload] = useState(null);

  const openModal = useCallback((type = "login", payload = null) => {
    setModalType(type);
    setModalPayload(payload);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setModalPayload(null);
  }, []);

  const switchModal = useCallback((type, payload = null) => {
    setModalType(type);
    setModalPayload(payload);
    setModalVisible(true);
  }, []);

  const value = useMemo(
    () => ({
      modalVisible,
      modalType,
      modalPayload,
      openModal,
      closeModal,
      switchModal,
    }),
    [modalVisible, modalType, modalPayload, openModal, closeModal, switchModal],
  );

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
};

export default ModalProvider;
