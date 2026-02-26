import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../../auth/stores/authStore";
import { useProfileStore } from "../../stores/profileStore";
import { UserHeader } from "../../../../shared/components/UserHeader/UserHeader";
import ProfileNav from "../ProfileNav";
import MetaData from "../../../../shared/components/MetaData/MetaData";
import "./Profile.css";

export const Profile = () => {
  const navigate = useNavigate();

  const { isAuthenticated } = useAuthStore();
  const { fetchProfile, fetchAddresses, fetchOrders } = useProfileStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Cargar datos del perfil cuando se monta el componente
    fetchProfile();
    fetchAddresses();
    fetchOrders();
  }, [isAuthenticated, navigate, fetchProfile, fetchAddresses, fetchOrders]);

  return (
    <>
      <MetaData title="Perfil de usuario" />
      <UserHeader />
      <main className="profile-page">
        <div className="profile-container">
          <h1 className="profile-title">Perfil</h1>
          <ProfileNav />
          <div style={{ marginTop: 8 }}>
            <Outlet />
          </div>
        </div>
      </main>
    </>
  );
};

export default Profile;
