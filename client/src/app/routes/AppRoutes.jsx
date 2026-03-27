import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequireAdmin } from "./routeGuards";
import { ROUTES } from "../../shared/constants";
import { NotFoundComponent } from "../../shared/components/NotFound/NotFoundComponent";

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

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Públicas */}
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.CONTACT} element={<ContactPage />} />
      <Route path={ROUTES.PRODUCTS} element={<Products />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.CHECKOUT} element={<CheckoutPage />} />

      {/* Privadas (usuario autenticado) */}
      <Route element={<RequireAuth />}>
        <Route path={ROUTES.PROFILE} element={<Profile />} />
        <Route path={ROUTES.PROFILE_INFO} element={<ProfileInfo />} />
        <Route path={ROUTES.PROFILE_ADDRESS} element={<ProfileAddress />} />
        <Route path={ROUTES.PROFILE_ORDERS} element={<ProfileOrders />} />
      </Route>

      {/* Privadas (admin) */}
      <Route element={<RequireAdmin />}>
        <Route path={ROUTES.ADMIN} element={<AdminProfile />} />
        <Route path={ROUTES.ADMIN_INSERT} element={<AdminInsert />} />
        <Route path={ROUTES.ADMIN_UPDATE} element={<AdminUpdate />} />
        <Route path={ROUTES.ADMIN_DELETE} element={<AdminDelete />} />
        <Route path={ROUTES.ADMIN_ORDERS} element={<AdminOrders />} />
      </Route>

      {/* Redirección opcional */}
      <Route path="/home" element={<Navigate to={ROUTES.HOME} replace />} />

      {/* 404 */}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundComponent />} />
    </Routes>
  );
};

export default AppRoutes;
