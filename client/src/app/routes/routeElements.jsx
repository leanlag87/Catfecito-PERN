import { HomePage } from "../../pages/home/HomePage";
import { ContactPage } from "../../pages/contact/ContactPage";
import { Products } from "../../features/products/components/Products";
import { Login } from "../../features/auth/components/Login";
import { Register } from "../../features/auth/components/Register";
import { Profile } from "../../features/profile/components/Profile/Profile";
import { ProfileInfo } from "../../features/profile/components/ProfileInfo";
import { ProfileAddress } from "../../features/profile/components/ProfileAddress";
import { ProfileOrders } from "../../features/profile/components/ProfileOrders/ProfileOrders";
import { CheckoutPage } from "../../features/orders/components/CheckoutPage/CheckoutPage";
import { AdminInsert } from "../../features/admin/components/AdminInsert";
import { AdminUpdate } from "../../features/admin/components/AdminUpdate";
import { AdminDelete } from "../../features/admin/components/AdminDelete";
import { AdminOrders } from "../../features/admin/components/AdminOrders";
import { AdminProfile } from "../../features/admin/components/AdminProfile/AdminProfile";

//Wrappers de rutas públicas con props compartidas
export const HomeRouteElement = ({
  cartItems,
  itemCount,
  isCartOpen,
  onOpenCart,
  onCloseCart,
  onUpdateQuantity,
  onRemoveItem,
  onOpenAuthModal,
}) => (
  <HomePage
    cartItems={cartItems}
    itemCount={itemCount}
    isCartOpen={isCartOpen}
    onOpenCart={onOpenCart}
    onCloseCart={onCloseCart}
    onUpdateQuantity={onUpdateQuantity}
    onRemoveItem={onRemoveItem}
    onOpenAuthModal={onOpenAuthModal}
  />
);

export const ContactRouteElement = () => <ContactPage />;

export const ProductsRouteElement = ({ onAddToCart, onOpenAuthModal }) => (
  <Products onAddToCart={onAddToCart} onOpenAuthModal={onOpenAuthModal} />
);

export const LoginRouteElement = () => <Login />;

export const RegisterRouteElement = () => <Register />;

export const CheckoutRouteElement = ({
  cartItems,
  subtotal,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onToggleCart,
}) => (
  <CheckoutPage
    cartItems={cartItems}
    subtotal={subtotal}
    onUpdateQuantity={onUpdateQuantity}
    onRemoveItem={onRemoveItem}
    onClearCart={onClearCart}
    onToggleCart={onToggleCart}
  />
);

//Wrappers de rutas privadas (auth)
export const ProfileRouteElement = () => <Profile />;
export const ProfileInfoRouteElement = () => <ProfileInfo />;
export const ProfileAddressRouteElement = () => <ProfileAddress />;
export const ProfileOrdersRouteElement = () => <ProfileOrders />;

//Wrappers de rutas privadas (admin)
export const AdminProfileRouteElement = () => <AdminProfile />;
export const AdminInsertRouteElement = () => <AdminInsert />;
export const AdminUpdateRouteElement = () => <AdminUpdate />;
export const AdminDeleteRouteElement = () => <AdminDelete />;
export const AdminOrdersRouteElement = () => <AdminOrders />;
