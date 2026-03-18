import { useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ADMIN_SECTIONS = [
  { key: "profile", label: "Panel", path: "/admin" },
  { key: "insert", label: "Insertar", path: "/admin/insert" },
  { key: "update", label: "Actualizar", path: "/admin/update" },
  { key: "delete", label: "Eliminar", path: "/admin/delete" },
  { key: "orders", label: "Pedidos", path: "/admin/orders" },
];

export const useAdminNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeSection = useMemo(() => {
    const found = ADMIN_SECTIONS.find((s) =>
      s.path === "/admin"
        ? location.pathname === "/admin"
        : location.pathname.startsWith(s.path),
    );
    return found?.key || "profile";
  }, [location.pathname]);

  const goToSection = useCallback(
    (sectionKey) => {
      const section =
        ADMIN_SECTIONS.find((s) => s.key === sectionKey) || ADMIN_SECTIONS[0];
      navigate(section.path);
    },
    [navigate],
  );

  const isActive = useCallback(
    (sectionKey) => activeSection === sectionKey,
    [activeSection],
  );

  return {
    sections: ADMIN_SECTIONS,
    activeSection,
    goToSection,
    isActive,
  };
};
