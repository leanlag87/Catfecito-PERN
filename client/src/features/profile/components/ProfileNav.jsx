import { useProfileNavigation } from "../hooks";
import "./Profile/Profile.css";

export const ProfileNav = () => {
  const { sections, goToSection, isActive } = useProfileNavigation();

  return (
    <nav
      className="profile-nav"
      style={{ display: "flex", gap: 8, marginBottom: 12 }}
    >
      {sections.map((section) => (
        <button
          key={section.key}
          type="button"
          onClick={() => goToSection(section.key)}
          className={isActive(section.key) ? "btn-primary" : "btn-secondary"}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
};

export default ProfileNav;
