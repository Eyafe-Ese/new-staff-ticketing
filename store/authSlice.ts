import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../utils/api";
import { RootState } from "./index";

// Define user roles
export type UserRole = "staff" | "it_officer" | "hr_admin";

// Define the role hierarchy (higher roles have more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  staff: 1,
  it_officer: 2,
  hr_admin: 3,
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    verified: boolean;
    avatarUrl?: string;
    profileImage?: string;
  } | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// Initialize state with values from localStorage if available
const getInitialState = (): AuthState => {
  // Only run in browser environment to avoid SSR issues
  if (typeof window !== "undefined") {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const userString = localStorage.getItem("user");

      if (accessToken && refreshToken && userString) {
        const user = JSON.parse(userString);
        return {
          accessToken,
          refreshToken,
          isAuthenticated: true,
          user,
          status: "idle",
          error: null,
        };
      }
    } catch (error) {
      console.error("Error restoring auth state:", error);
    }
  }

  return {
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    user: null,
    status: "idle",
    error: null,
  };
};

const initialState: AuthState = getInitialState();

export const login = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      const { accessToken, refreshToken, user } = response.data.data;

      // Always save tokens in localStorage for persistence
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const refreshAuthToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const refreshToken = state.auth.refreshToken;

      if (!refreshToken) {
        return rejectWithValue("No refresh token available");
      }

      // Call the refresh token endpoint
      const response = await api.post("/auth/refresh", { refreshToken });
      console.log("Refresh token response:", response.data); // Log the response for debugging

      // Get the tokens from the response
      // Adjust this based on your API response structure
      const accessToken = response.data.data?.accessToken || response.data.accessToken;
      const newRefreshToken = response.data.data?.refreshToken || response.data.refreshToken || refreshToken;

      // Update tokens in localStorage
      localStorage.setItem("accessToken", accessToken);
      
      // If a new refresh token is provided, update it too
      if (newRefreshToken && newRefreshToken !== refreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: any) {
      console.error("Token refresh failed:", error.response?.data || error.message);
      
      // If refresh fails, clear auth state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      return rejectWithValue(
        error.response?.data?.message || "Session expired. Please login again."
      );
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      // Clear tokens from localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // In a real app, you might want to call a logout endpoint
      // await api.post('/auth/logout');

      return null;
    } catch (error: any) {
      return rejectWithValue("Logout failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;

      // Update localStorage
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    clearCredentials: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;

      // Clear localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },
    restoreAuthState: (state) => {
      // This is a no-op reducer that will be used to restore auth state
      // The actual restoration happens in getInitialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.status = "succeeded";
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        // If token refresh fails, clear credentials
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setCredentials, clearCredentials, restoreAuthState } =
  authSlice.actions;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectUserRole = (state: RootState) =>
  state.auth.user?.role as UserRole;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;

// Role-based helper functions
export const hasRole = (state: RootState, requiredRole: UserRole): boolean => {
  const userRole = selectUserRole(state);
  if (!userRole) return false;

  return ROLE_HIERARCHY[userRole as UserRole] >= ROLE_HIERARCHY[requiredRole];
};

export const isAdmin = (state: RootState): boolean => {
  return hasRole(state, "hr_admin");
};

export const isDepartmentOfficer = (state: RootState): boolean => {
  return hasRole(state, "it_officer");
};

export default authSlice.reducer;
