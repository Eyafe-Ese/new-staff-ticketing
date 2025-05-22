'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { restoreAuthState } from '@/store/authSlice';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { refreshCsrfToken } from '@/utils/api';

// CSRF token refresh interval (30 minutes)
const CSRF_REFRESH_INTERVAL = 30 * 60 * 1000;

interface PersistGateProps {
  children: ReactNode;
}

export function PersistGate({ children }: PersistGateProps) {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  const csrfTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize token refresh mechanism
  useTokenRefresh();

  useEffect(() => {
    // Restore authentication state from localStorage
    dispatch(restoreAuthState());
    setIsInitialized(true);

    // Immediately fetch a new CSRF token
    refreshCsrfToken()
      .then(() => console.log('Initial CSRF token fetched'))
      .catch(err => console.error('Failed to fetch initial CSRF token:', err));

    // Set up periodic CSRF token refresh
    csrfTimerRef.current = setInterval(() => {
      refreshCsrfToken()
        .then(() => console.log('CSRF token refreshed'))
        .catch(err => console.error('Failed to refresh CSRF token:', err));
    }, CSRF_REFRESH_INTERVAL);

    // Clean up function
    return () => {
      if (csrfTimerRef.current) {
        clearInterval(csrfTimerRef.current);
        csrfTimerRef.current = null;
      }
    };
  }, [dispatch]);

  // You can show a loading indicator during initialization if needed
  if (!isInitialized) {
    return null; // Or a loading spinner/skeleton
  }

  return <>{children}</>;
} 