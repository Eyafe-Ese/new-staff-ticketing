import axios, { AxiosProgressEvent } from "axios";

// Determine the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

// Define interface for file upload options
interface FileUploadOptions {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  [key: string]: unknown;
}

// CSRF token storage (in-memory only, not persisted to localStorage/sessionStorage)
let csrfToken: string | null = null;

// Define a type for the store
interface Store {
  getState: () => {
    auth: {
      accessToken: string | null;
      refreshToken: string | null;
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        verified: boolean;
        avatarUrl?: string;
        profileImage?: string;
      } | null;
      isAuthenticated: boolean;
      status: "idle" | "loading" | "succeeded" | "failed";
      error: string | null;
    };
  };
  dispatch: (action: { type: string; payload?: unknown }) => void;
}

// Function to fetch CSRF token
const fetchCsrfToken = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/security/csrf-token`, {
      withCredentials: true, // Include cookies
    });

    if (response.data && response.data.token) {
      csrfToken = response.data.token;
      return response.data.token;
    }
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    return null;
  }
};

// Export function to refresh CSRF token
export const refreshCsrfToken = fetchCsrfToken;

// Create an axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies in requests (for CSRF cookie)
  timeout: 30000, // Increase default timeout to 30 seconds
});

// Utility function for file uploads with extended timeout
export const createFileUploadRequest = (url: string, data: FormData, options: FileUploadOptions = {}) => {
  return api.post(url, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 60 seconds timeout for file uploads
    // Add support for upload progress tracking
    onUploadProgress: options?.onUploadProgress,
    ...options,
  });
};

// Log API configuration in development (but not production)
if (process.env.NODE_ENV !== "production") {
  console.log(`🔌 API configured with base URL: ${API_BASE_URL}`);
}

// Store reference to be set after initialization
let storeRef: Store | null = null;

// Function to set the store reference
export const setStoreRef = (store: Store) => {
  storeRef = store;
};

// Variable to track ongoing token refresh
let isRefreshing = false;
// Queue of requests waiting for token refresh
let refreshSubscribers: Array<(token: string) => void> = [];

// Function to add request to the queue
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Function to process the queue with new token
const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

// Add a request interceptor to include the auth token and CSRF token
api.interceptors.request.use(
  (config) => {
    // For debugging token issues
    const requestUrl = config.url || 'unknown';
    
    // Add authorization token if available
    if (storeRef) {
      const state = storeRef.getState();
      const { accessToken } = state.auth;

      // If token exists, add it to the auth header
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        // Log non-refresh token requests to track token usage
        if (!requestUrl.includes('/auth/refresh')) {
          console.log(`Request to ${requestUrl} with auth token`);
        }
      } else {
        console.log(`Request to ${requestUrl} without auth token (not found in store)`);
      }
    } else {
      // If store is not available yet but token is in localStorage
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        // Log non-refresh token requests to track token usage
        if (!requestUrl.includes('/auth/refresh')) {
          console.log(`Request to ${requestUrl} with auth token from localStorage`);
        }
      } else {
        console.log(`Request to ${requestUrl} without auth token (not found in localStorage)`);
      }
    }

    // Add CSRF token for non-GET requests
    if (csrfToken && config.method !== "get" && config.method !== "GET") {
      // You can customize the header name as needed by your backend
      config.headers["X-CSRF-Token"] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Create a separate instance for internal use to avoid circular dependencies during refresh
// This instance doesn't have response interceptors to prevent infinite loops
const internalAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

// Add request interceptor to internal axios instance to include CSRF token
internalAxios.interceptors.request.use(
  async (config) => {
    // Add CSRF token for non-GET requests
    if (config.method !== "get" && config.method !== "GET") {
      // If CSRF token is not available, try to fetch it before proceeding
      if (!csrfToken) {
        console.log("CSRF token not available, fetching before proceeding with request");
        try {
          await fetchCsrfToken();
        } catch (error) {
          console.error("Failed to fetch CSRF token before request", error);
        }
      }
      
      // Now add the CSRF token to the header if it's available
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      } else {
        console.warn("CSRF token still not available after fetch attempt");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log(`API error: ${error.response?.status} for ${originalRequest.url}`);

    // Handle unauthorized errors (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If a refresh is already in progress, wait for it to complete
        console.log("Token refresh already in progress, queuing request");
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      console.log("Starting token refresh process");

      try {
        const refreshToken = storeRef?.getState()?.auth?.refreshToken || localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        console.log("Calling refresh token endpoint");
        // Use internal axios instance with CSRF token for refresh
        const response = await internalAxios.post(`/auth/refresh`, { refreshToken });
        console.log("Refresh token response received");
        
        // Handle different response structures
        const accessToken = response.data.data?.accessToken || response.data.accessToken;
        const newRefreshToken = response.data.data?.refreshToken || response.data.refreshToken || refreshToken;

        if (!accessToken) {
          throw new Error("No access token in refresh response");
        }

        console.log("Received new access token, updating storage");
        // Update token in localStorage
        localStorage.setItem("accessToken", accessToken);
        
        // If a new refresh token was provided, update it
        if (newRefreshToken && newRefreshToken !== refreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // Update token in store if available
        if (storeRef) {
          storeRef.dispatch({
            type: "auth/setCredentials",
            payload: {
              accessToken,
              refreshToken: newRefreshToken,
              user: storeRef.getState().auth.user,
            },
          });
        }

        // Process waiting requests
        console.log("Processing waiting requests with new token");
        onTokenRefreshed(accessToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        isRefreshing = false;
        console.log("Retrying original request with new token");
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        
        // Check specifically for CSRF validation errors
        const error = refreshError as { response?: { data?: { message?: string } } };
        if (error.response?.data?.message?.includes('CSRF validation failed')) {
          console.warn("CSRF validation failed during token refresh, will retry with fresh CSRF token");
          
          // Try to fetch a new CSRF token
          try {
            await fetchCsrfToken();
            console.log("New CSRF token fetched after validation failure");
            
            // Reset the refresh state to allow a retry
            isRefreshing = false;
            originalRequest._retry = false;
            
            // Retry the original request
            return axios(originalRequest);
          } catch (csrfError) {
            console.error("Failed to fetch new CSRF token:", csrfError);
          }
        }
        
        // If refresh fails, clear auth state
        if (storeRef) {
          storeRef.dispatch({ type: "auth/clearCredentials" });
        } else {
          // If store is not available, clear localStorage directly
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }

        // Redirect to login page
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Initialize by fetching CSRF token
fetchCsrfToken().catch(error => {
  console.error("Failed to fetch initial CSRF token, will retry:", error);
  
  // Retry after a delay to handle race conditions during app initialization
  setTimeout(() => {
    fetchCsrfToken().catch(retryError => {
      console.error("Second attempt to fetch CSRF token failed:", retryError);
    });
  }, 2000);
});

export default api; 
