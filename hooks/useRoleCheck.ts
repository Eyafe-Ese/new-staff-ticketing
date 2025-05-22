import { useSelector } from 'react-redux';
import { 
  UserRole, 
  ROLE_HIERARCHY, 
  selectUserRole, 
  selectIsAuthenticated 
} from '@/store/authSlice';

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
   * Check if the current user has admin role
   */
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  /**
   * Check if the current user has super admin role
   */
  const isDepartmentOfficer = (): boolean => {
    return hasRole('department_officer');
  };

  /**
   * Check if the current user has staff role or higher
   */
  const isStaffOrHigher = (): boolean => {
    return hasRole('staff');
  };

  return {
    userRole,
    isAuthenticated,
    hasRole,
    isAdmin,
    isDepartmentOfficer,
    isStaffOrHigher
  };
} 