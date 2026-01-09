import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { UserHeader } from '../components/usersComponents/UserHeader';
import ProfileNav from '../components/profileComponents/ProfileNav';
import MetaData from '../components/ui/MetaData/MetaData';
import './Profile.css';

export const Profile = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const token = sessionStorage.getItem('authToken');
		if (!token) {
			navigate('/login');
			return;
		}
	}, [navigate]);

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

