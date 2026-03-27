import { useContext } from "react";
import { ModalContext } from "./modalContext";

export const useModal = () => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error("useModal debe usarse dentro de <ModalProvider>");
  }

  return context;
};

export default useModal;
