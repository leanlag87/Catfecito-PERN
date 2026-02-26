import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../../auth/stores/authStore";
import { UserHeader } from "../../../../shared/components/UserHeader/UserHeader";
import MetaData from "../../../../shared/components/MetaData/MetaData";
import AdminNav from "../AdminNav";
import "./AdminProfile.css";

export const AdminProfile = () => {
  const navigate = useNavigate();

  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role !== "admin") {
      navigate("/");
      return;
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <>
      <MetaData title="Perfil de administrador" />
      <UserHeader />
      <main className="profile-page-admin">
        <div className="profile-admin-container">
          <h1 className="profile-title-admin">Panel de Admin</h1>
          <AdminNav />
          <div style={{ marginTop: 8 }}>
            <Outlet />
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminProfile;
