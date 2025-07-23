export const getCurrentAuthUser = () => {
  // First check the global auth state
  if (window.__authState) {
    return window.__authState
  }
  
  // Then try to get from the auth store
  try {
    import('../store/useAuthStore').then(({ useAuthStore }) => {
      const authState = useAuthStore.getState();
      if (authState.user && authState.isAuthenticated) {
        const authUser = {
          username: authState.user.username || null,
          userId: authState.user.userId || null,
          isAuthenticated: authState.isAuthenticated
        };
        // Update global state for immediate access
        updateGlobalAuthState(authUser);
        return authUser;
      }
    }).catch(() => {});
  } catch (error) {
  }

  
  return null
}

declare global {
  interface Window {
    __authState: {
      username: string | null
      userId: string | null
      isAuthenticated: boolean | null
    } | null
  }
}

export const updateGlobalAuthState = (authState: {
  username: string | null
  userId: string | null
  isAuthenticated: boolean | null
}) => {
  window.__authState = authState
}

if (typeof window !== 'undefined') {
  window.__authState = null
}