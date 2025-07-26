import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import api from "../hooks/api";
import toast from "react-hot-toast";
import { updateGlobalAuthState, getCurrentAuthUser } from "../utils/authHelpers";

export type ThemeType = 'light' | 'dark';

interface UserSettings {
  theme: ThemeType;
}

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface SettingsActions {
  setTheme: (theme: ThemeType) => Promise<void>;
  updateThemeLocally: (theme: ThemeType) => void;
  
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  initialize: () => Promise<void>;
  
  getTheme: () => ThemeType;
  getSettings: () => UserSettings;
}

type SettingsStore = SettingsState & SettingsActions;

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
};

const getInitialTheme = (): ThemeType => {
  if (typeof window === "undefined") return "light";

  // Get theme from global auth state
  const authUser = getCurrentAuthUser();
  if (authUser && authUser.theme && ["light", "dark"].includes(authUser.theme)) {
    return authUser.theme as ThemeType;
  }

  return "light";
};

const applyThemeToDOM = (theme: ThemeType) => {
  if (typeof window === "undefined") return;

  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);

  // Force a repaint for smooth transition
  document.body.style.display = "none";
  document.body.offsetHeight;
  document.body.style.display = "";
};

const useRawSettingsStore = create<SettingsStore>()(
  immer((set, get) => ({
    settings: {
      ...DEFAULT_SETTINGS,
      theme: getInitialTheme(),
    },
    isLoading: false,
    error: null,
    isInitialized: false,

    setTheme: async (theme: ThemeType) => {
      const currentTheme = get().settings.theme;
      
      // Set loading state
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // Send to backend first and wait for response
        await api.patch("/user/settings", { theme });

        // Only update after successful backend response
        set((state) => {
          state.settings.theme = theme;
          state.isLoading = false;
        });

        // Apply theme to DOM
        applyThemeToDOM(theme);

        // Update global auth state with new theme
        const authUser = getCurrentAuthUser();
        if (authUser) {
          updateGlobalAuthState({
            username: authUser.username,
            userId: authUser.userId,
            theme: theme,
            isAuthenticated: authUser.isAuthenticated
          });
        }

        toast.success("Theme updated successfully", {
          duration: 2000,
          id: 'theme-update-success',
        });

      } catch (error: any) {
        // Revert to current theme on error
        set((state) => {
          state.settings.theme = currentTheme;
          state.isLoading = false;
          state.error = error?.response?.data?.message || "Failed to update theme";
        });

        toast.error("Failed to update theme. Please try again.", {
          duration: 3000,
          id: 'theme-update-error',
        });

        console.error("Failed to update theme:", error);
      }
    },

    updateThemeLocally: (theme: ThemeType) => {
      set((state) => {
        state.settings.theme = theme;
      });

      applyThemeToDOM(theme);

      // Update global auth state with new theme
      const authUser = getCurrentAuthUser();
      if (authUser) {
        updateGlobalAuthState({
          username: authUser.username,
          userId: authUser.userId,
          theme: theme,
          isAuthenticated: authUser.isAuthenticated
        });
      }
    },

    fetchSettings: async () => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const response = await api.get("/user/settings");
        const fetchedSettings: UserSettings = {
          theme: response.data.theme || DEFAULT_SETTINGS.theme,
        };

        set((state) => {
          state.settings = fetchedSettings;
          state.isLoading = false;
          state.isInitialized = true;
        });

        applyThemeToDOM(fetchedSettings.theme);

        const authUser = getCurrentAuthUser();
        if (authUser) {
          updateGlobalAuthState({
            username: authUser.username,
            userId: authUser.userId,
            theme: fetchedSettings.theme,
            isAuthenticated: authUser.isAuthenticated
          });
        }

      } catch (error: any) {
        set((state) => {
          state.isLoading = false;
          state.isInitialized = true;
          state.error = error?.response?.data?.message || "Failed to fetch settings";
        });

        console.error("Failed to fetch settings:", error);
      }
    },

    updateSettings: async (newSettings: Partial<UserSettings>) => {
      const currentSettings = get().settings;

      // Optimistically update
      set((state) => {
        state.settings = { ...state.settings, ...newSettings };
        state.error = null;
      });

      try {
        set((state) => {
          state.isLoading = true;
        });

        // Convert settings to Map<String, String> format for Java backend
        const settingsMap: Record<string, string> = {};
        Object.entries(newSettings).forEach(([key, value]) => {
          settingsMap[key] = String(value);
        });

        await api.patch("/user/settings", settingsMap );

        set((state) => {
          state.isLoading = false;
        });

        // Apply theme if it was updated
        if (newSettings.theme) {
          applyThemeToDOM(newSettings.theme);
          
          // Update global auth state with new theme
          const authUser = getCurrentAuthUser();
          if (authUser) {
            updateGlobalAuthState({
              username: authUser.username,
              userId: authUser.userId,
              theme: newSettings.theme,
              isAuthenticated: authUser.isAuthenticated
            });
          }
        }

        toast.success("Settings updated successfully", {
          duration: 2000,
          id: 'settings-update-success',
        });

      } catch (error: any) {
        // Revert changes on error
        set((state) => {
          state.settings = currentSettings;
          state.isLoading = false;
          state.error = error?.response?.data?.message || "Failed to update settings";
        });

        // Revert theme if it was changed
        if (newSettings.theme) {
          applyThemeToDOM(currentSettings.theme);
          
          // Revert global auth state theme
          const authUser = getCurrentAuthUser();
          if (authUser) {
            updateGlobalAuthState({
              username: authUser.username,
              userId: authUser.userId,
              theme: currentSettings.theme,
              isAuthenticated: authUser.isAuthenticated
            });
          }
        }

        toast.error("Failed to update settings. Please try again.", {
          duration: 3000,
          id: 'settings-update-error',
        });

        console.error("Failed to update settings:", error);
      }
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

    initialize: async () => {
      if (!get().isInitialized) {
        await get().fetchSettings();
      }
    },

    getTheme: () => {
      return get().settings.theme;
    },

    getSettings: () => {
      return get().settings;
    },
  }))
);

export const useSettingsStore = createSelectors<SettingsState, SettingsActions>(useRawSettingsStore);

export { useRawSettingsStore };