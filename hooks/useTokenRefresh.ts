import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { refreshAuthToken, selectIsAuthenticated } from '@/store/authSlice';
import { AppDispatch } from '@/store';

// Token refresh interval in milliseconds (default: 15 minutes)
// Consider reducing this for testing
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
// const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes (for testing)

// Track if a refresh is currently in progress from the hook
let isHookRefreshing = false;

/**
 * Hook to manage automatic token refresh in the background
 */
export function useTokenRefresh() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to perform the token refresh
  const performTokenRefresh = async () => {
    // Avoid multiple simultaneous refresh attempts
    if (isHookRefreshing) {
      console.log('Token refresh already in progress, skipping');
      return;
    }
    
    try {
      isHookRefreshing = true;
      console.log('Starting scheduled token refresh');
      // Attempt to refresh the token
      const result = await dispatch(refreshAuthToken()).unwrap();
      console.log('Token refreshed successfully from scheduled refresh', result);
    } catch (error) {
      console.error('Background token refresh failed:', error);
      // Token refresh is handled in the reducer,
      // so we don't need to do anything else here
    } finally {
      isHookRefreshing = false;
    }
  };

  useEffect(() => {
    // Log the initial state
    console.log('Token refresh hook initialized, auth state:', isAuthenticated ? 'authenticated' : 'not authenticated');
    
    // Function to set up the refresh timer
    const setupRefreshTimer = () => {
      // Calculate next refresh time
      const nextRefreshTime = new Date(Date.now() + REFRESH_INTERVAL);
      console.log(`Setting up token refresh timer. Next refresh at: ${nextRefreshTime.toLocaleTimeString()}`);
      
      // Clear any existing timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      
      // Set up the new timer
      refreshTimerRef.current = setInterval(performTokenRefresh, REFRESH_INTERVAL);
      
      // Also perform an initial refresh immediately if it's been a while
      // Get token expiry time from localStorage if available
      const tokenTimestamp = localStorage.getItem('tokenTimestamp');
      if (tokenTimestamp) {
        const elapsed = Date.now() - parseInt(tokenTimestamp);
        // If token is older than 10 minutes, refresh it immediately
        if (elapsed > 10 * 60 * 1000) {
          console.log('Token is older than 10 minutes, refreshing immediately');
          // Add a delay to ensure CSRF token is available
          setTimeout(() => {
            performTokenRefresh();
          }, 1500); // 1.5 second delay
        }
      } else {
        // No timestamp, set it now
        localStorage.setItem('tokenTimestamp', Date.now().toString());
      }
    };

    // Clear any existing timer when authentication state changes
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Only set up refresh timer if the user is authenticated
    if (isAuthenticated) {
      setupRefreshTimer();
      
      // Update token timestamp whenever the user authenticates
      localStorage.setItem('tokenTimestamp', Date.now().toString());
    } else {
      console.log('User not authenticated, not setting up token refresh');
    }

    // Clean up function
    return () => {
      console.log('Cleaning up token refresh timer');
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [isAuthenticated, dispatch]);

  // Perform an immediate token refresh when authentication state changes to true
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Authentication state changed to authenticated, refreshing token');
      // Add a small delay before initial token refresh to ensure CSRF token is loaded
      setTimeout(() => {
        performTokenRefresh();
      }, 1000); // 1 second delay
    }
  }, [isAuthenticated]);

  return null;
} 