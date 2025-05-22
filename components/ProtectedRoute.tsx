'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, UserRole } from '@/store/authSlice';
import { ReactNode } from 'react';
import { useRoleCheck } from '@/hooks/useRoleCheck';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallbackPath = '/'
}: ProtectedRouteProps) {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { hasRole } = useRoleCheck();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // If a role is required and user doesn't have it, redirect to fallback
    if (requiredRole && !hasRole(requiredRole)) {
      router.push(fallbackPath);
    }
  }, [isAuthenticated, requiredRole, hasRole, router, fallbackPath]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if a role is required and user doesn't have it
  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  return <>{children}</>;
} 