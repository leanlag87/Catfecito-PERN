import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/stores/authStore";
import { useProfileStore } from "../stores/profileStore";

export const useProfileBootstrap = () => {
  const navigate = useNavigate();
  const bootstrappedRef = useRef(false);

  const { isAuthenticated } = useAuthStore();
  const { fetchProfile, fetchAddresses, fetchOrders } = useProfileStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    fetchProfile();
    fetchAddresses();
    fetchOrders();
  }, [isAuthenticated, navigate, fetchProfile, fetchAddresses, fetchOrders]);
};
