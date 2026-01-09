import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { UserHeader } from '../components/usersComponents/UserHeader';
import MetaData from '../components/ui/MetaData/MetaData';
import './AdminProfile.css';
import AdminNav from '../components/adminComponents/AdminNav';


export const AdminProfile = () => {
	const navigate = useNavigate();
	// estado mínimo en este layout, los formularios están en admincomponents/

	useEffect(() => {
		// Require auth token to access admin panel
				const token = sessionStorage.getItem('authToken');
				if (!token) {
					navigate('/login');
					return;
				}

				// No cargamos datos aquí: cada subcomponente carga lo que necesite
	}, [navigate]);

		// Los subformularios realizan sus propias llamadas

	return (
		<>
			<MetaData title="Perfil de administrador" />
			<UserHeader />
			<main className="profile-page-admin">
				<div className="profile-admin-container">
					<h1 className="profile-title-admin">Panel de Admin</h1>
					<AdminNav />
					<div style={{ marginTop: 8 }}>
						{/* Outlet para subrutas: insert / update / delete */}
						<Outlet />
					</div>
				</div>
			</main>
		</>
	);
};

export default AdminProfile;
