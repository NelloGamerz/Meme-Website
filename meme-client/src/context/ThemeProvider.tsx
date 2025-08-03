import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { initializeTheme, getInMemoryTheme } from "../store/useSettingsStore";
import { saveThemeToIndexedDB } from "../utils/indexedDBCache";

type ThemeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const getInitialTheme = async (): Promise<ThemeType> => {
  if (typeof window === "undefined") return "light";

  try {
    await initializeTheme();
    
    const savedTheme = getInMemoryTheme();
    if (savedTheme && ["light", "dark"].includes(savedTheme)) {
      return savedTheme as ThemeType;
    }
  } catch (error) {
    console.error("Failed to get initial theme:", error);
  }

  return "light";
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeType>("light");

  useEffect(() => {
    const initializeTheme = async () => {
      const initialTheme = await getInitialTheme();
      setThemeState(initialTheme);
    };
    initializeTheme();
  }, []);

  const applyTheme = useCallback((themeValue: ThemeType) => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    root.classList.add(themeValue);

    document.body.style.display = "none";
    document.body.offsetHeight;
    document.body.style.display = "";
  }, []);

  const setTheme = useCallback(
    async (newTheme: ThemeType) => {
      applyTheme(newTheme);
      setThemeState(newTheme);
      
      try {
        await saveThemeToIndexedDB(newTheme, false);
      } catch (error) {
        console.error("Failed to save theme to IndexedDB:", error);
      }
      
      setTimeout(() => {
        applyTheme(newTheme);
      }, 50);
    },
    [applyTheme]
  );


  useEffect(() => {
    applyTheme(theme);
    const timeoutId = setTimeout(() => {
      applyTheme(theme);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(async () => {
    const nextTheme: ThemeType = theme === "light" ? "dark" : "light";
    await setTheme(nextTheme);
  }, [theme, setTheme]);

  const contextValue = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
