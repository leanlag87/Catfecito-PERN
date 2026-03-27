import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "../features/auth/stores/authStore";
import { useCartStore } from "../features/cart/stores/cartStore";
import { FloatingCart } from "../features/cart/components/FloatingCart/FloatingCart";
import ModalContainer from "../shared/components/Modal/ModalContainer";
import { InstallPWA } from "../shared/components/InstallPWA/InstallPWA";
import { ROUTES } from "../shared/constants";
import AppRoutes from "./routes/AppRoutes";

function FloatingCartWrapper({ isOpen, onCloseCart, ...rest }) {
  const location = useLocation();
  const path = location.pathname || "";

  const hide =
    path.startsWith(ROUTES.PROFILE) ||
    path.startsWith(ROUTES.ADMIN) ||
    path === ROUTES.CHECKOUT;

  useEffect(() => {
    if (hide && isOpen && typeof onCloseCart === "function") {
      onCloseCart();
    }
  }, [hide, isOpen, onCloseCart]);

  if (hide) return null;
  return <FloatingCart isOpen={isOpen} onCloseCart={onCloseCart} {...rest} />;
}

function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("login");

  const { isAuthenticated, logout } = useAuthStore();

  const {
    items,
    isCartOpen,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    syncCartWithBackend,
  } = useCartStore();

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);
  const switchModal = (type) => setModalType(type);

  const handleSuccess = async () => {
    await syncCartWithBackend();
    setModalVisible(false);
  };

  // Auto-logout por inactividad
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeout;
    const MAX_INACTIVE_TIME = 600 * 1000; // 10 min
    const LOGOUT_MODAL_DELAY = 10_000; // 10 seg

    const handleLogoutDueToInactivity = () => {
      setModalType("logout");
      setModalVisible(true);

      window.setTimeout(() => {
        logout();
      }, LOGOUT_MODAL_DELAY);
    };

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = window.setTimeout(
        handleLogoutDueToInactivity,
        MAX_INACTIVE_TIME,
      );
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [isAuthenticated, logout]);

  return (
    <Router>
      <AppRoutes
        cartItems={items}
        itemCount={itemCount}
        isCartOpen={isCartOpen}
        subtotal={subtotal}
        onAddToCart={addItem}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateQuantity}
        onClearCart={clearCart}
        onOpenCart={openCart}
        onCloseCart={closeCart}
        onToggleCart={toggleCart}
        onOpenAuthModal={openModal}
      />

      <ModalContainer
        type={modalType}
        visible={modalVisible}
        onClose={closeModal}
        onSwitch={switchModal}
        onSuccess={handleSuccess}
      />

      <FloatingCartWrapper
        items={items}
        itemCount={itemCount}
        isOpen={isCartOpen}
        onOpenCart={openCart}
        onCloseCart={closeCart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onOpenAuthModal={openModal}
      />

      <InstallPWA />
    </Router>
  );
}

export default App;
