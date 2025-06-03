import { useSelector } from "react-redux";
import {
  UserRole,
  ROLE_HIERARCHY,
  selectUserRole,
  selectIsAuthenticated,
} from "@/store/authSlice";

/**
 * Custom hook for checking user roles and permissions
 */
export function useRoleCheck() {
  const userRole = useSelector(selectUserRole);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  /**
   * Check if the current user has a specific role or higher
   */
  const hasRole = (requiredRole: UserRole): boolean => {
    if (!isAuthenticated || !userRole) return false;
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
  };

  /**
   * Check if the current user has HR admin role
   */
  const isHRAdmin = (): boolean => {
    return hasRole("hr_admin");
  };

  /**
   * Check if the current user has IT officer role
   */
  const isITOfficer = (): boolean => {
    return hasRole("it_officer");
  };

  /**
   * Check if the current user has staff role or higher
   */
  const isStaffOrHigher = (): boolean => {
    return hasRole("staff");
  };

  return {
    userRole,
    isAuthenticated,
    hasRole,
    isHRAdmin,
    isITOfficer,
    isStaffOrHigher,
  };
}
