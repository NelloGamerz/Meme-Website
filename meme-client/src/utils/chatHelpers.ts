import toast from 'react-hot-toast';

// Add TypeScript declaration for window.__authState
declare global {
  interface Window {
    __authState: {
      username: string | null;
      isAuthenticated: boolean | null;
    } | null;
    useAuthStore?: any;
  }
}

export const handleChatError = (error: any, defaultMessage: string): string => {
  const message = error?.response?.data?.message || error?.message || defaultMessage;
  
  // Show toast notification for errors
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
  });
  
  console.error(defaultMessage, error);
  return message;
};

export const getCurrentUser = (): string => {
  // Try to get current user from auth context first
  try {
    // Use window.__authState which is set by authHelpers.ts
    if (window.__authState && window.__authState.username) {
      return window.__authState.username;
    }
    
    // Try to get from auth store directly
    try {
      // @ts-ignore - Dynamic import
      const authStore = window.useAuthStore?.getState();
      if (authStore?.user?.username) {
        return authStore.user.username;
      }
    } catch (storeError) {
      console.warn('Failed to get user from auth store', storeError);
    }
  } catch (e) {
    console.warn('Failed to get user from auth context', e);
  }
  
  // Fallback to localStorage
  try {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) return storedUser;
    
    const userStore = localStorage.getItem('user');
    if (userStore) {
      const userData = JSON.parse(userStore);
      return userData.username || userData.userName || 'current_user';
    }
  } catch (storageError) {
    console.warn('Failed to get user from localStorage', storageError);
  }
  
  return 'current_user';
};

export const formatChatTime = (timestamp: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - timestamp.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return timestamp.toLocaleDateString();
  }
};