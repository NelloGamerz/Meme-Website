export const getCurrentTheme = async (): Promise<string | null> => {
  try {
    const { getThemeFromIndexedDB } = await import('./indexedDBCache');
    const themeSettings = await getThemeFromIndexedDB();
    return themeSettings ? themeSettings.theme : null;
  } catch (error) {
    console.error('Failed to get theme from IndexedDB:', error);
    return null;
  }
};


import { useAuthStore } from '../store/useAuthStore';

export const getCurrentAuthUser = () => {
  if (window.__authState) {
    return window.__authState;
  }

  try {
    const authState = useAuthStore.getState();
    if (authState.user && authState.isAuthenticated) {
      const authUser = {
        username: authState.user.username || null,
        isAuthenticated: authState.isAuthenticated,
      };
      updateGlobalAuthState(authUser);
      return authUser;
    }
  } catch (error) {
    console.error(error);
  }

  return null;
};

declare global {
  interface Window {
    __authState: {
      username: string | null;
      isAuthenticated: boolean | null;
    } | null;
  }
}

export const updateGlobalAuthState = (authState: {
  username: string | null;
  isAuthenticated: boolean | null;
}) => {
  window.__authState = authState;
};



if (typeof window !== 'undefined') {
  window.__authState = null;
}
