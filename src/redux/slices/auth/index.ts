import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// localStorage key for auth state
const AUTH_STORAGE_KEY = "deepeigen_auth_user";

interface User {
  email: string;
  rememberMe?: boolean;
  // Add other user properties as needed
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superadmin?: boolean;
  date_joined?: string;
  last_login?: string;
  country?: string;
  profile_picture?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isInitialized: boolean;
}

// Helper to get user from localStorage
const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading from localStorage:", error);
  }
  return null;
};

// Helper to save auth data to localStorage
const saveAuthToStorage = (user: User | null, access?: string | null, refresh?: string | null): void => {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      if (access) localStorage.setItem('access', access);
      if (refresh) localStorage.setItem('refresh', refresh);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    }
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

// Initialize state from localStorage
const getInitialState = (): AuthState => {
  return {
    user: getStoredUser(),
    accessToken: localStorage.getItem('access'),
    refreshToken: localStorage.getItem('refresh'),
    isInitialized: true,
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; access?: string; refresh?: string }>) => {
      const { user, access, refresh } = action.payload;
      state.user = user;
      if (access) state.accessToken = access;
      if (refresh) state.refreshToken = refresh;
      // Save to localStorage whenever user is set
      saveAuthToStorage(user, access, refresh);
    },
    setTokens: (state, action: PayloadAction<{ access: string; refresh?: string }>) => {
      const { access, refresh } = action.payload;
      state.accessToken = access;
      localStorage.setItem('access', access);
      if (refresh) {
        state.refreshToken = refresh;
        localStorage.setItem('refresh', refresh);
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      // Clear localStorage on logout
      saveAuthToStorage(null);
    },
    // Action to clear auth state without clearing storage (for session expiry)
    clearAuthState: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    },
    // Action to reinitialize from localStorage (useful for page refresh)
    reinitializeAuth: (state) => {
      state.user = getStoredUser();
      state.accessToken = localStorage.getItem('access');
      state.refreshToken = localStorage.getItem('refresh');
      state.isInitialized = true;
    },
  },
});

export const { setUser, setTokens, logout, clearAuthState, reinitializeAuth } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  !!state.auth.user || !!state.auth.accessToken;
export const selectIsInitialized = (state: { auth: AuthState }) =>
  state.auth.isInitialized;

export const selectIsAdmin = (state: { auth: AuthState }) =>
  state.auth.user?.is_staff || state.auth.user?.is_superadmin || false;
