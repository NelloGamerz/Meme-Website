import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

type ThemeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const getInitialTheme = (): ThemeType => {
  if (typeof window === "undefined") return "light";

  try {
    const savedTheme = localStorage.getItem("theme") as ThemeType;
    if (savedTheme && ["light", "dark"].includes(savedTheme)) {
      return savedTheme;
    }
  } catch (error) {}

  return "light";
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeType>(getInitialTheme);

  const applyTheme = useCallback((themeValue: ThemeType) => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    root.classList.add(themeValue);

    // Force a repaint
    document.body.style.display = "none";
    document.body.offsetHeight;
    document.body.style.display = "";
  }, []);

  // Function to set theme with side effects
  const setTheme = useCallback(
    (newTheme: ThemeType) => {
      applyTheme(newTheme);
      setThemeState(newTheme);
      try {
        localStorage.setItem("theme", newTheme);
        window.dispatchEvent(new Event("storage"));
      } catch (error) {}
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

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeType = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
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
