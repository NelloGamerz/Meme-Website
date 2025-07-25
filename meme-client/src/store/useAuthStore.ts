import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import axios from "axios";
import { updateGlobalAuthState } from "../utils/authHelpers";

export const API_URL = import.meta.env.VITE_API_URL;

interface AuthUser {
  userId: string;
  username: string;
  email?: string;
  profilePicture?: string;
  name?: string;
  theme?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  checkAuth: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  initialize: () => Promise<void>;
  
  getCurrentUser: () => AuthUser | null;
  getUserId: () => string;
  getUsername: () => string;
  getTheme: () => string;
}

type AuthStore = AuthState & AuthActions;

const useRawAuthStore = create<AuthStore>()(
  immer((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,

    checkAuth: async () => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const response = await axios.get(`${API_URL}auth/me`, { 
          withCredentials: true 
        });
        
        const userData: AuthUser = {
          userId: response.data.userId,
          username: response.data.username,
          email: response.data.email,
          profilePicture: response.data.profilePicture,
          name: response.data.name,
          theme: response.data.theme,
        };

        set((state) => {
          state.user = userData;
          state.isAuthenticated = true;
          state.isLoading = false;
          state.isInitialized = true;
        });

        // Update global auth state
        updateGlobalAuthState({
          username: userData.username,
          userId: userData.userId,
          theme: userData.theme ?? null,
          isAuthenticated: true
        });

        try {
          const { useUserStore } = await import("../store/useUserStore");
          const { handleAuthStateChange } = useUserStore.getState() as {
            handleAuthStateChange: (authUser: { userId: string; username: string } | null) => Promise<void>;
          };
          await handleAuthStateChange({
            userId: userData.userId,
            username: userData.username
          });
        } catch (profileError) {
        }

        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { user: userData, isAuthenticated: true }
        }));

      } catch (error) {
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.isLoading = false;
          state.isInitialized = true;
          state.error = null;
        });

        // Update global auth state
        updateGlobalAuthState({
          username: null,
          userId: null,
          theme: null,
          isAuthenticated: false
        });

        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { user: null, isAuthenticated: false }
        }));
      }
    },

    setUser: (user: AuthUser | null) => {
      set((state) => {
        state.user = user;
        state.isAuthenticated = !!user;
      });

      // Update global auth state
      updateGlobalAuthState({
        username: user?.username || null,
        userId: user?.userId || null,
        theme: user?.theme || null,
        isAuthenticated: !!user
      });
    },

    setAuthenticated: (isAuthenticated: boolean) => {
      set((state) => {
        state.isAuthenticated = isAuthenticated;
      });
    },

    setLoading: (isLoading: boolean) => {
      set((state) => {
        state.isLoading = isLoading;
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },

    clearAuth: () => {
      set((state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });

      // Update global auth state
      updateGlobalAuthState({
        username: null,
        userId: null,
        theme: null,
        isAuthenticated: false
      });
    },

    initialize: async () => {
      if (!get().isInitialized) {
        await get().checkAuth();
      }
    },

    getCurrentUser: () => {
      return get().user;
    },

    getUserId: () => {
      return get().user?.userId || "";
    },

    getUsername: () => {
      return get().user?.username || "";
    },

    getTheme: () => {
      return get().user?.theme || "";
    },
  }))
);

export const useAuthStore = createSelectors<AuthState, AuthActions>(useRawAuthStore);

export { useRawAuthStore };