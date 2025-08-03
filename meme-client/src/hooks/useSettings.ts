import { useEffect } from 'react';
import { useSettingsStore, ThemeType } from '../store/useSettingsStore';

export const useSettings = () => {
  const settings = useSettingsStore.use.settings();
  const isLoading = useSettingsStore.use.isLoading();
  const error = useSettingsStore.use.error();
  const isInitialized = useSettingsStore.use.isInitialized();
  
  const setTheme = useSettingsStore.use.setTheme();
  const updateThemeLocally = useSettingsStore.use.updateThemeLocally();
  const fetchSettings = useSettingsStore.use.fetchSettings();
  const updateSettings = useSettingsStore.use.updateSettings();
  const syncPendingChanges = useSettingsStore.use.syncPendingChanges();
  const initialize = useSettingsStore.use.initialize();
  const setError = useSettingsStore.use.setError();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return {
    settings,
    theme: settings.theme,
    isLoading,
    error,
    isInitialized,
    
    setTheme,
    updateThemeLocally,
    fetchSettings,
    updateSettings,
    syncPendingChanges,
    initialize,
    setError,
    
    toggleTheme: () => {
      const newTheme: ThemeType = settings.theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
    },
    
    clearError: () => setError(null),
  };
};

export default useSettings;