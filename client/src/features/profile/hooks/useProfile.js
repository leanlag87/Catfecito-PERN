import { useMemo } from "react";
import { useProfileStore } from "../stores/profileStore";
import {
  normalizeProfile,
  isProfileComplete,
  getProfileCompleteness,
  formatFullName,
  getNameInitials,
  formatFullAddress,
} from "../services/profile.service";

export const useProfile = () => {
  const {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    clearError,
    reset,
  } = useProfileStore();

  const normalizedProfile = useMemo(() => normalizeProfile(profile), [profile]);

  const fullName = useMemo(
    () => formatFullName(normalizedProfile?.name || ""),
    [normalizedProfile?.name],
  );

  const initials = useMemo(
    () => getNameInitials(normalizedProfile?.name || ""),
    [normalizedProfile?.name],
  );

  const fullAddress = useMemo(
    () => formatFullAddress(profile || normalizedProfile),
    [profile, normalizedProfile],
  );

  const profileCompleted = useMemo(
    () => isProfileComplete(profile || normalizedProfile),
    [profile, normalizedProfile],
  );

  const completeness = useMemo(
    () => getProfileCompleteness(profile || normalizedProfile),
    [profile, normalizedProfile],
  );

  return {
    // estado
    profile: normalizedProfile,
    isLoading,
    error,

    // derivados
    fullName,
    initials,
    fullAddress,
    isComplete: profileCompleted,
    completeness,

    // acciones
    fetchProfile,
    updateProfile,
    clearError,
    reset,
  };
};
