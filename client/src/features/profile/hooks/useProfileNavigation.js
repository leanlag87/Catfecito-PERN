import { useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const VALID_SECTIONS = ["info", "address", "orders", "security"];

export const useProfileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeSection = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section") || "info";
    return VALID_SECTIONS.includes(section) ? section : "info";
  }, [location.search]);

  const goToSection = useCallback(
    (section) => {
      const safeSection = VALID_SECTIONS.includes(section) ? section : "info";
      navigate(`${location.pathname}?section=${safeSection}`, {
        replace: false,
      });
    },
    [navigate, location.pathname],
  );

  const isActive = useCallback(
    (section) => activeSection === section,
    [activeSection],
  );

  return {
    activeSection,
    sections: VALID_SECTIONS,
    goToSection,
    isActive,
  };
};
