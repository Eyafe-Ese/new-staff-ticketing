'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  selectIsAuthenticated, 
  selectUserRole, 
  UserRole, 
  ROLE_HIERARCHY 
} from '@/store/authSlice';
import { ReactNode } from 'react';

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRole: UserRole;
  fallbackPath?: string;
}

export function RoleProtectedRoute({ 
  children, 
  requiredRole,
  fallbackPath = '/'
}: RoleProtectedRouteProps) {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    // If authenticated but doesn't have required role, redirect to fallback
    if (userRole && ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[requiredRole]) {
      router.push(fallbackPath);
    }
  }, [isAuthenticated, userRole, requiredRole, router, fallbackPath]);

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if authenticated but doesn't have required role
  if (userRole && ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[requiredRole]) {
    return null;
  }

  return <>{children}</>;
} 