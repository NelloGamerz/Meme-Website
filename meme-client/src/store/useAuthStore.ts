import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import axios from "axios";
import { updateGlobalAuthState } from "../utils/authHelpers";

export const API_URL = import.meta.env.VITE_API_URL;

interface AuthUser {
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

        updateGlobalAuthState({
          username: userData.username,
          isAuthenticated: true
        });

        try {
          const { useUserStore } = await import("../store/useUserStore");
          const { handleAuthStateChange } = useUserStore.getState() as {
            handleAuthStateChange: (authUser: {username: string } | null) => Promise<void>;
          };
          await handleAuthStateChange({
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

        updateGlobalAuthState({
          username: null,
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

      updateGlobalAuthState({
        username: user?.username || null,
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

      updateGlobalAuthState({
        username: null,
        isAuthenticated: false
      });

      import('../utils/storageCleanup').then(({ clearAllUserData }) => {
        clearAllUserData().catch(error => {
          console.error('Failed to clear storage data during auth clear:', error);
        });
      }).catch(error => {
        console.error('Failed to import storage cleanup module:', error);
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