import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useCartStore } from "../features/cart/stores/cartStore";
import { FloatingCart } from "../features/cart/components/FloatingCart/FloatingCart";
import ModalContainer from "../shared/components/Modal/ModalContainer";
import { InstallPWA } from "../shared/components/InstallPWA/InstallPWA";
import { ROUTES } from "../shared/constants";
import AppRoutes from "./routes/AppRoutes";
import { AppProviders, useModal } from "./providers";

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

function AppContent() {
  const { modalVisible, modalType, openModal, closeModal, switchModal } =
    useModal();

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

  const handleSuccess = async () => {
    await syncCartWithBackend();
    closeModal();
  };

  return (
    <>
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
    </>
  );
}

function App() {
  return (
    <Router>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </Router>
  );
}

export default App;
