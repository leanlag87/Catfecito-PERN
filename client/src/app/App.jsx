import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuthStore } from "../features/auth/stores/authStore";
import { useCartStore } from "../features/cart/stores/cartStore";
import { HomePage } from "../pages/home/HomePage";
import ContactPage from "../pages/contact/ContactPage";
import { Products } from "../features/products/components/Products";
import { FloatingCart } from "../features/cart/components/FloatingCart/FloatingCart";
import { Login } from "../features/auth/components/Login";
import { Register } from "../features/auth/components/Register";
import ModalContainer from "../shared/components/Modal/ModalContainer";
import { Profile } from "../features/profile/components/Profile/Profile";
import { AdminProfile } from "../features/admin/components/AdminProfile/AdminProfile";
import AdminInsert from "../features/admin/components/AdminInsert";
import AdminUpdate from "../features/admin/components/AdminUpdate";
import AdminDelete from "../features/admin/components/AdminDelete";
import ProfileInfo from "../features/profile/components/ProfileInfo";
import ProfileOrders from "../features/profile/components/ProfileOrders/ProfileOrders";
import ProfileAddress from "../features/profile/components/ProfileAddress";
import { CheckoutPage } from "../features/orders/components/CheckoutPage/CheckoutPage";
import AdminOrders from "../features/admin/components/AdminOrders";
import { InstallPWA } from "../shared/components/InstallPWA/InstallPWA";

function FloatingCartWrapper({ isOpen, onCloseCart, ...rest }) {
  const location = useLocation();
  const path = location.pathname || "";
  const hide =
    path.startsWith("/profile") ||
    path.startsWith("/admin") ||
    path === "/checkout";

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

  // Store de autenticación
  const { isAuthenticated, logout } = useAuthStore();

  // Store del carrito
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
    const MAX_INACTIVE_TIME = 600 * 1000; // 10 minutos

    const handleLogoutDueToInactivity = () => {
      // Mostrar modal de logout
      setModalType("logout");
      setModalVisible(true);

      // Ejecutar logout después de 10 segundos
      setTimeout(() => {
        logout();
      }, 10000);
    };

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleLogoutDueToInactivity, MAX_INACTIVE_TIME);
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
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              cartItems={items}
              itemCount={itemCount}
              isCartOpen={isCartOpen}
              onRemoveItem={removeItem}
              onUpdateQuantity={updateQuantity}
              onOpenCart={openCart}
              onCloseCart={closeCart}
              onOpenAuthModal={openModal}
            />
          }
        />
        <Route
          path="/contact"
          element={
            <ContactPage
              cartItems={items}
              itemCount={itemCount}
              isCartOpen={isCartOpen}
              onRemoveItem={removeItem}
              onUpdateQuantity={updateQuantity}
              onOpenCart={openCart}
              onCloseCart={closeCart}
              onOpenAuthModal={openModal}
            />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />}>
          <Route path="info" element={<ProfileInfo />} />
          <Route path="orders" element={<ProfileOrders />} />
          <Route path="address" element={<ProfileAddress />} />
        </Route>
        <Route path="/admin" element={<AdminProfile />}>
          <Route path="insert" element={<AdminInsert />} />
          <Route path="update" element={<AdminUpdate />} />
          <Route path="delete" element={<AdminDelete />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
        <Route
          path="/products"
          element={
            <Products
              cartItems={items}
              itemCount={itemCount}
              isCartOpen={isCartOpen}
              onAddToCart={addItem}
              onRemoveItem={removeItem}
              onUpdateQuantity={updateQuantity}
              onOpenCart={openCart}
              onCloseCart={closeCart}
              onToggleCart={toggleCart}
              subtotal={subtotal}
              onClearCart={clearCart}
              onOpenAuthModal={openModal}
            />
          }
        />
        <Route
          path="/checkout"
          element={
            <CheckoutPage
              cartItems={items}
              subtotal={subtotal}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
            />
          }
        />
      </Routes>

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
