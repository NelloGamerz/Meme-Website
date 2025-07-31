import { useEffect } from 'react';
import { initializeTheme } from '../store/useSettingsStore';

export const useThemeInitializer = () => {
  useEffect(() => {
    const init = async () => {
      try {
        await initializeTheme();
      } catch (error) {
        console.warn('Failed to initialize theme:', error);
      }
    };

    init();
  }, []);
};