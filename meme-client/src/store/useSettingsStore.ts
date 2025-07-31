import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import api from "../hooks/api";
import toast from "react-hot-toast";

import { 
  saveThemeToIndexedDB, 
  getThemeFromIndexedDB, 
  markThemeAsSynced, 
  needsThemeSync 
} from "../utils/indexedDBCache";

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
  syncPendingChanges: () => Promise<void>;
  
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

let inMemoryTheme: ThemeType = "light";
let isThemeInitialized = false;

const getInitialThemeSync = (): ThemeType => {
  if (typeof window === "undefined") return "light";

  // If already initialized, return in-memory theme
  if (isThemeInitialized) {
    return inMemoryTheme;
  }

  return "light";
};

// Initialize theme from IndexedDB into memory
const initializeThemeInMemory = async (): Promise<void> => {
  if (isThemeInitialized) return;

  try {
    const indexedDBSettings = await getThemeFromIndexedDB();
    if (indexedDBSettings && ["light", "dark"].includes(indexedDBSettings.theme)) {
      inMemoryTheme = indexedDBSettings.theme as ThemeType;
    }
  } catch (error) {
    console.warn("Failed to initialize theme from IndexedDB:", error);
  }
  
  isThemeInitialized = true;
};

const applyThemeToDOM = (theme: ThemeType) => {
  if (typeof window === "undefined") return;

  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);

  document.body.style.display = "none";
  document.body.offsetHeight;
  document.body.style.display = "";
};

const useRawSettingsStore = create<SettingsStore>()(
  immer((set, get) => ({
    settings: {
      ...DEFAULT_SETTINGS,
      theme: getInitialThemeSync(),
    },
    isLoading: false,
    error: null,
    isInitialized: false,

    setTheme: async (theme: ThemeType) => {
      const currentTheme = get().settings.theme;
      
      // Update in-memory theme immediately for instant UI response
      inMemoryTheme = theme;
      
      set((state) => {
        state.isLoading = true;
        state.error = null;
        state.settings.theme = theme; // Update store state immediately
      });

      // Apply theme to DOM immediately
      applyThemeToDOM(theme);

      try {
        // Make backend call
        await api.patch("/user/settings", { theme });

        // After successful backend response, save to IndexedDB as synced
        try {
          await saveThemeToIndexedDB(theme, true); // Mark as synced since backend call succeeded
        } catch (error) {
          console.warn("Failed to save theme to IndexedDB:", error);
        }

        set((state) => {
          state.isLoading = false;
        });

        toast.success("Theme updated successfully", {
          duration: 2000,
          id: 'theme-update-success',
        });

      } catch (error: any) {
        // Revert in-memory theme and store state
        inMemoryTheme = currentTheme;
        
        set((state) => {
          state.settings.theme = currentTheme;
          state.isLoading = false;
          state.error = error?.response?.data?.message || "Failed to update theme";
        });

        // Revert DOM theme
        applyThemeToDOM(currentTheme);

        toast.error("Failed to update theme. Please try again.", {
          duration: 3000,
          id: 'theme-update-error',
        });

        console.error("Failed to update theme:", error);
      }
    },

    updateThemeLocally: (theme: ThemeType) => {
      // Update in-memory theme
      inMemoryTheme = theme;
      
      set((state) => {
        state.settings.theme = theme;
      });

      applyThemeToDOM(theme);
    },

    fetchSettings: async () => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const response = await api.get("/user/settings");
        const serverTheme = response.data.theme || DEFAULT_SETTINGS.theme;
        
        // Check if IndexedDB has a theme preference
        let finalTheme = serverTheme;
        try {
          const indexedDBSettings = await getThemeFromIndexedDB();
          if (indexedDBSettings && ["light", "dark"].includes(indexedDBSettings.theme)) {
            // Use IndexedDB theme as the source of truth
            finalTheme = indexedDBSettings.theme as ThemeType;
            
            // If IndexedDB theme differs from server, sync it to server
            if (finalTheme !== serverTheme) {
              try {
                await api.patch("/user/settings", { theme: finalTheme });
              } catch (syncError) {
                console.warn("Failed to sync IndexedDB theme to server:", syncError);
                finalTheme = serverTheme;
              }
            }
          }
        } catch (error) {
          console.warn("Failed to check IndexedDB theme:", error);
        }

        const fetchedSettings: UserSettings = {
          theme: finalTheme,
        };

        // Update in-memory theme
        inMemoryTheme = finalTheme;

        set((state) => {
          state.settings = fetchedSettings;
          state.isLoading = false;
          state.isInitialized = true;
        });

        applyThemeToDOM(fetchedSettings.theme);

        // Save to IndexedDB as synced
        try {
          await saveThemeToIndexedDB(fetchedSettings.theme, true);
        } catch (error) {
          console.warn("Failed to save fetched theme to IndexedDB:", error);
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

      set((state) => {
        state.settings = { ...state.settings, ...newSettings };
        state.error = null;
      });

      try {
        set((state) => {
          state.isLoading = true;
        });

        const settingsMap: Record<string, string> = {};
        Object.entries(newSettings).forEach(([key, value]) => {
          settingsMap[key] = String(value);
        });

        await api.patch("/user/settings", settingsMap );

        set((state) => {
          state.isLoading = false;
        });

        if (newSettings.theme) {
          applyThemeToDOM(newSettings.theme);
        }

        toast.success("Settings updated successfully", {
          duration: 2000,
          id: 'settings-update-success',
        });

      } catch (error: any) {
        set((state) => {
          state.settings = currentSettings;
          state.isLoading = false;
          state.error = error?.response?.data?.message || "Failed to update settings";
        });

        if (newSettings.theme) {
          applyThemeToDOM(currentSettings.theme);
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
      if (get().isInitialized) return;

      try {
        // Initialize in-memory theme from IndexedDB
        await initializeThemeInMemory();
        
        // Update store with in-memory theme
        set((state) => {
          state.settings.theme = inMemoryTheme;
        });
        
        // Apply theme immediately
        applyThemeToDOM(inMemoryTheme);

        // Then fetch from server to ensure sync
        await get().fetchSettings();
        
      } catch (error) {
        console.warn("Failed to initialize from IndexedDB, falling back to server:", error);
        // Fallback to server-only initialization
        await get().fetchSettings();
      }
    },

    getTheme: () => {
      // Return in-memory theme for instant access
      return isThemeInitialized ? inMemoryTheme : get().settings.theme;
    },

    getSettings: () => {
      return get().settings;
    },

    syncPendingChanges: async () => {
      try {
        const needsSync = await needsThemeSync();
        if (!needsSync) return;

        const indexedDBSettings = await getThemeFromIndexedDB();
        if (!indexedDBSettings) return;

        const theme = indexedDBSettings.theme as ThemeType;
        
        await api.patch("/user/settings", { theme });
        
        await markThemeAsSynced();
                
      } catch (error) {
        console.error("Failed to sync pending changes:", error);
        throw error;
      }
    },
  }))
);

export const useSettingsStore = createSelectors<SettingsState, SettingsActions>(useRawSettingsStore);

export { useRawSettingsStore };

export const initializeTheme = initializeThemeInMemory;
export const getInMemoryTheme = (): ThemeType => inMemoryTheme;