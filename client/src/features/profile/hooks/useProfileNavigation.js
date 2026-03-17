import { useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SECTIONS = [
  { key: "info", label: "Mi Información", path: "/profile/info" },
  { key: "orders", label: "Mis Pedidos", path: "/profile/orders" },
  { key: "address", label: "Mi Dirección", path: "/profile/address" },
];

export const useProfileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeSection = useMemo(() => {
    const found = SECTIONS.find((s) => location.pathname.startsWith(s.path));
    return found?.key || "info";
  }, [location.pathname]);

  const goToSection = useCallback(
    (sectionKey) => {
      const section = SECTIONS.find((s) => s.key === sectionKey) || SECTIONS[0];
      navigate(section.path);
    },
    [navigate],
  );

  const isActive = useCallback(
    (sectionKey) => activeSection === sectionKey,
    [activeSection],
  );

  return {
    activeSection,
    sections: SECTIONS,
    goToSection,
    isActive,
  };
};
