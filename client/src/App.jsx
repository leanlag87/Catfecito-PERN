import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import React from "react";
import { useCartLogic } from "./hooks/useCartLogic";
import { HomePage } from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import { Products } from "./pages/Products";
import { FloatingCart } from "./components/cartComponents/FloatingCart";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import ModalContainer from "./components/Modal/ModalContainer";
import { useState, useEffect } from 'react';
import { Profile } from "./pages/Profile";
import { AdminProfile } from "./pages/AdminProfile";
import AdminInsert from "./components/admincomponents/AdminInsert";
import AdminUpdate from "./components/admincomponents/AdminUpdate";
import AdminDelete from "./components/admincomponents/AdminDelete";
import ProfileInfo from "./components/profileComponents/ProfileInfo";
import ProfileOrders from "./components/profileComponents/ProfileOrders";
import ProfileAddress from "./components/profileComponents/ProfileAddress";
import { CheckoutPage } from "./pages/CheckoutPage";
import AdminOrders from "./components/admincomponents/AdminOrders";


function FloatingCartWrapper({ isOpen, onCloseCart, ...rest }) {
  const location = useLocation();
  const path = location.pathname || '';
  const hide = path.startsWith('/profile') || path.startsWith('/admin') || path === '/checkout';

  // cerrar carrito si la ruta lo oculta y está abierto
  React.useEffect(() => {
    if (hide && isOpen && typeof onCloseCart === 'function') {
      onCloseCart();
    }
  }, [hide, isOpen, onCloseCart]);

  if (hide) return null;
  return <FloatingCart isOpen={isOpen} onCloseCart={onCloseCart} {...rest} />;
}

function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('login');
  
  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const switchModal = (type) => setModalType(type);

  const handleSuccess = async () => {
    // payload can contain user/token if needed
    // Sincronizar carrito después del login y esperar a que termine
    await syncCartWithBackend();
    setModalVisible(false);
  };
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
    syncCartWithBackend
  } = useCartLogic();

  

    useEffect(() => {
    let timeout;
    const MAX_INACTIVE_TIME = 600 * 1000; // 10 minutos

    const handleLogoutDueToInactivity = () => {
      // Elimina token y usuario
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authUser');
      // Muestra modal de logout
      setModalType('logout');
      setModalVisible(true);

      // Espera 2.2 segundos antes de redirigir
      setTimeout(() => {
        window.location.replace('/');
      }, 10000);
    };

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleLogoutDueToInactivity, MAX_INACTIVE_TIME);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
      console.log("Sesión expirada por inactividad");
    };
    
  }, []);

  return (
    <Router>
      {/* Auth buttons removed; header will open modal via onOpenAuthModal */}

      <Routes>
        <Route path= "/" element={<HomePage 
          cartItems={items}
          itemCount={itemCount}
          isCartOpen={isCartOpen}
          onRemoveItem={removeItem}
          onUpdateQuantity={updateQuantity}
          onOpenCart={openCart}
          onCloseCart={closeCart}
          onOpenAuthModal={openModal}
        />} />
        <Route path="/contact" element={<ContactPage
          cartItems={items}
          itemCount={itemCount}
          isCartOpen={isCartOpen}
          onRemoveItem={removeItem}
          onUpdateQuantity={updateQuantity}
          onOpenCart={openCart}
          onCloseCart={closeCart}
          onOpenAuthModal={openModal}
        />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} >
          <Route path="info" element={<ProfileInfo />} />
          <Route path="orders" element={<ProfileOrders />} />
          <Route path="address" element={<ProfileAddress />} />
        </Route>
        <Route path="/admin" element={<AdminProfile />} >
          <Route path="insert" element={<AdminInsert />} />
          <Route path="update" element={<AdminUpdate />} />
          <Route path="delete" element={<AdminDelete />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
        <Route path="/products" element={<Products 
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
        />} />
        <Route path="/checkout" element={<CheckoutPage 
          cartItems={items}
          subtotal={subtotal}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
        />} />
      </Routes>
  <ModalContainer type={modalType} visible={modalVisible} onClose={closeModal} onSwitch={switchModal} onSuccess={handleSuccess} />
      <FloatingCartWrapper
        items={items}
        itemCount={itemCount}
        isOpen={isCartOpen}
        onOpenCart={openCart}
        onCloseCart={closeCart}        // <- cambio aquí
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onOpenAuthModal={openModal}
      />
    </Router>

  );
}

export default App;
