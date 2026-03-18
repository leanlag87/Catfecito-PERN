import { useAdminNavigation } from "../hooks";
import "./AdminProfile/AdminProfile.css";

export const AdminNav = () => {
  const { sections, goToSection, isActive } = useAdminNavigation();

  // Si no queres mostrar "Panel", lo filtramos:
  const visibleSections = sections.filter((s) => s.key !== "profile");

  return (
    <nav
      className="profile-nav-admin"
      style={{ display: "flex", gap: 8, marginBottom: 12 }}
    >
      {visibleSections.map((section) => (
        <button
          key={section.key}
          type="button"
          onClick={() => goToSection(section.key)}
          className={isActive(section.key) ? "btn-primary" : "btn-secondary"}
        >
          {section.key === "insert" && "Agregar producto"}
          {section.key === "update" && "Actualizar producto"}
          {section.key === "delete" && "Eliminar producto"}
          {section.key === "orders" && "Pedidos"}
        </button>
      ))}
    </nav>
  );
};

export default AdminNav;
