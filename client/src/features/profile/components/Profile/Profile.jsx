import { Outlet } from "react-router-dom";
import { UserHeader } from "../../../../shared/components/UserHeader/UserHeader";
import ProfileNav from "../ProfileNav";
import MetaData from "../../../../shared/components/MetaData/MetaData";
import { useProfileBootstrap } from "../../hooks";
import "./Profile.css";

export const Profile = () => {
  useProfileBootstrap();

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
