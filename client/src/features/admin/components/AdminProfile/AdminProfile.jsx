import { Outlet } from "react-router-dom";
import { UserHeader } from "../../../../shared/components/UserHeader/UserHeader";
import MetaData from "../../../../shared/components/MetaData/MetaData";
import AdminNav from "../AdminNav";
import { useAdminAccess } from "../../hooks";
import "./AdminProfile.css";

export const AdminProfile = () => {
  const { hasChecked, isAllowed, isLoading, error } = useAdminAccess();

  if (!hasChecked || isLoading) {
    return (
      <>
        <MetaData title="Perfil de administrador" />
        <UserHeader />
        <main className="profile-page-admin">
          <div className="profile-admin-container">
            <div className="profile-card-admin">Validando acceso...</div>
          </div>
        </main>
      </>
    );
  }

  if (!isAllowed) return null; // useAdminAccess ya redirige

  return (
    <>
      <MetaData title="Perfil de administrador" />
      <UserHeader />
      <main className="profile-page-admin">
        <div className="profile-admin-container">
          <h1 className="profile-title-admin">Panel de Admin</h1>
          {error && <div className="profile-error-admin">{error}</div>}
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
