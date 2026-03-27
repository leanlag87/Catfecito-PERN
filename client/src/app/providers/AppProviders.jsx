import { ModalProvider } from "./ModalProvider";
import { useModal } from "./useModal";
import { AuthInactivityProvider } from "./AuthInactivityProvider";

const InactivityBridge = ({ children }) => {
  const { openModal } = useModal();

  return (
    <AuthInactivityProvider onInactivityDetected={() => openModal("logout")}>
      {children}
    </AuthInactivityProvider>
  );
};

//Composición central de providers globales de la app.
export const AppProviders = ({ children }) => {
  return (
    <ModalProvider>
      <InactivityBridge>{children}</InactivityBridge>
    </ModalProvider>
  );
};

export default AppProviders;
