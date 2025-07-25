import { useEffect, useState } from 'react';
import { getCurrentTheme, updateGlobalAuthState, getCurrentAuthUser } from '../utils/authHelpers';

type ThemeType = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const savedTheme = getCurrentTheme();
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme as ThemeType;
    }
    return 'system';
  });

  const applyTheme = (themeValue: ThemeType) => {
    const root = window.document.documentElement;
    
    if (themeValue === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    } else {
      root.classList.toggle('dark', themeValue === 'dark');
    }
  };

  useEffect(() => {
    applyTheme(theme);
    
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

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setThemeValue = (newTheme: ThemeType) => {
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  return { theme, setTheme: setThemeValue, toggleTheme, applyTheme };
};