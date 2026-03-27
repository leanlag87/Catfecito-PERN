import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequireAdmin } from "./routeGuards";
import { ROUTES } from "../../shared/constants";
import { NotFoundComponent } from "../../shared/components/NotFound/NotFoundComponent";
import {
  HomeRouteElement,
  ContactRouteElement,
  ProductsRouteElement,
  LoginRouteElement,
  RegisterRouteElement,
  CheckoutRouteElement,
  ProfileRouteElement,
  ProfileInfoRouteElement,
  ProfileAddressRouteElement,
  ProfileOrdersRouteElement,
  AdminProfileRouteElement,
  AdminInsertRouteElement,
  AdminUpdateRouteElement,
  AdminDeleteRouteElement,
  AdminOrdersRouteElement,
} from "./routeElements";

export const AppRoutes = ({
  cartItems,
  itemCount,
  isCartOpen,
  subtotal,
  onAddToCart,
  onRemoveItem,
  onUpdateQuantity,
  onClearCart,
  onOpenCart,
  onCloseCart,
  onToggleCart,
  onOpenAuthModal,
}) => {
  return (
    <Routes>
      {/* Públicas */}
      <Route
        path={ROUTES.HOME}
        element={
          <HomeRouteElement
            cartItems={cartItems}
            itemCount={itemCount}
            isCartOpen={isCartOpen}
            onOpenCart={onOpenCart}
            onCloseCart={onCloseCart}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onOpenAuthModal={onOpenAuthModal}
          />
        }
      />
      <Route path={ROUTES.CONTACT} element={<ContactRouteElement />} />
      <Route
        path={ROUTES.PRODUCTS}
        element={
          <ProductsRouteElement
            onAddToCart={onAddToCart}
            onOpenAuthModal={onOpenAuthModal}
          />
        }
      />
      <Route path={ROUTES.LOGIN} element={<LoginRouteElement />} />
      <Route path={ROUTES.REGISTER} element={<RegisterRouteElement />} />
      <Route
        path={ROUTES.CHECKOUT}
        element={
          <CheckoutRouteElement
            cartItems={cartItems}
            subtotal={subtotal}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onClearCart={onClearCart}
            onToggleCart={onToggleCart}
          />
        }
      />

      {/* Privadas (usuario autenticado) */}
      <Route element={<RequireAuth />}>
        <Route path={ROUTES.PROFILE} element={<ProfileRouteElement />} />
        <Route
          path={ROUTES.PROFILE_INFO}
          element={<ProfileInfoRouteElement />}
        />
        <Route
          path={ROUTES.PROFILE_ADDRESS}
          element={<ProfileAddressRouteElement />}
        />
        <Route
          path={ROUTES.PROFILE_ORDERS}
          element={<ProfileOrdersRouteElement />}
        />
      </Route>

      {/* Privadas (admin) */}
      <Route element={<RequireAdmin />}>
        <Route path={ROUTES.ADMIN} element={<AdminProfileRouteElement />} />
        <Route
          path={ROUTES.ADMIN_INSERT}
          element={<AdminInsertRouteElement />}
        />
        <Route
          path={ROUTES.ADMIN_UPDATE}
          element={<AdminUpdateRouteElement />}
        />
        <Route
          path={ROUTES.ADMIN_DELETE}
          element={<AdminDeleteRouteElement />}
        />
        <Route
          path={ROUTES.ADMIN_ORDERS}
          element={<AdminOrdersRouteElement />}
        />
      </Route>

      {/* Redirección */}
      <Route
        path={ROUTES.HOME_ALIAS || "/home"}
        element={<Navigate to={ROUTES.HOME} replace />}
      />

      {/* 404 */}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundComponent />} />
    </Routes>
  );
};

export default AppRoutes;
