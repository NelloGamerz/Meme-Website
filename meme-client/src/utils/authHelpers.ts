export const getCurrentAuthUser = () => {
  // First check the global auth state
  if (window.__authState) {
    return window.__authState
  }
  
  // Then try to get from the auth store synchronously
  try {
    const { useAuthStore } = require('../store/useAuthStore');
    const authState = useAuthStore.getState();
    if (authState.user && authState.isAuthenticated) {
      const authUser = {
        username: authState.user.username || null,
        userId: authState.user.userId || null,
        theme: authState.user.theme || null,
        isAuthenticated: authState.isAuthenticated
      };
      // Update global state for immediate access
      updateGlobalAuthState(authUser);
      return authUser;
    }
  } catch (error) {
    // Ignore error if store is not available
  }

  return null
}

declare global {
  interface Window {
    __authState: {
      username: string | null
      userId: string | null
      theme: string | null
      isAuthenticated: boolean | null
    } | null
  }
}

export const updateGlobalAuthState = (authState: {
  username: string | null
  userId: string | null
  theme: string | null
  isAuthenticated: boolean | null
}) => {
  window.__authState = authState
}

export const getCurrentTheme = (): string | null => {
  // First check the global auth state
  if (window.__authState) {
    return window.__authState.theme
  }
  
  // Then try to get from the auth store synchronously
  try {
    const { useAuthStore } = require('../store/useAuthStore');
    const authState = useAuthStore.getState();
    if (authState.user && authState.isAuthenticated) {
      return authState.user.theme || null;
    }
  } catch (error) {
    // Ignore error if store is not available
  }

  return null
}

if (typeof window !== 'undefined') {
  window.__authState = null
}