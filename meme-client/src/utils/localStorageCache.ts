const memoryCache: Record<string, unknown> = {};
const lastReadTime: Record<string, number> = {};
const DEFAULT_CACHE_EXPIRATION = 5 * 60 * 1000;
export function getFromStorage<T>(key: string, expirationMs = DEFAULT_CACHE_EXPIRATION): T | null {
  const now = Date.now();
  if (
    memoryCache[key] !== undefined && 
    lastReadTime[key] && 
    now - lastReadTime[key] < expirationMs
  ) {
    return memoryCache[key] as T | null;
  }
  
  try {
    const item = localStorage.getItem(key);
    
    if (item === null) {
      memoryCache[key] = null;
      lastReadTime[key] = now;
      return null;
    }
    
    const value = JSON.parse(item) as T;
    memoryCache[key] = value;
    lastReadTime[key] = now;
    return value;
  } catch (error) {
    return null;
  }
}
export function setInStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    memoryCache[key] = value;
    lastReadTime[key] = Date.now();
  } catch (error) {
  }
}
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
    delete memoryCache[key];
    delete lastReadTime[key];
  } catch (error) {
  }
}
export function getCurrentUser(): {
  username: string;
  profilePicture?: string;
  email?: string;
  name?: string;
} {
  try {
    const { getCurrentAuthUser } = require('./authHelpers');
    const authUser = getCurrentAuthUser();
    
    if (authUser && authUser.username) {
      return {
        username: authUser.username,
        profilePicture: undefined,
        email: undefined,
        name: undefined,
      };
    }
  } catch (error) {
    console.error(error);
  }
  
  const user = getFromStorage<{
    userId: string;
    username: string;
    profilePicture?: string;
    email?: string;
    name?: string;
  }>('user');
  
  return user || {
    userId: "",
    username: "",
  };
}
export function updateCurrentUser(userData: Partial<{
  userId: string;
  username: string;
  profilePicture?: string;
  email?: string;
  name?: string;
}>): void {
  const currentUser = getCurrentUser();
  setInStorage('user', { ...currentUser, ...userData });
}

export function getLikedMemeIds(): string[] {
  return getFromStorage<string[]>('likedMemes') || [];
}

export function getSavedMemeIds(): string[] {
  return getFromStorage<string[]>('savedMemes') || [];
}

export function updateLikedMemeIds(memeIds: string[]): void {
  setInStorage('likedMemes', memeIds);
}

export function updateSavedMemeIds(memeIds: string[]): void {
  setInStorage('savedMemes', memeIds);
}

export function invalidateCache(key: string): void {
  delete memoryCache[key];
  delete lastReadTime[key];
}
export function invalidateAllCache(): void {
  Object.keys(memoryCache).forEach(key => {
    delete memoryCache[key];
    delete lastReadTime[key];
  });
}

/**
 * Clear all localStorage data
 */
export function clearAllLocalStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Clear specific user-related data from localStorage
 */
export function clearUserDataFromLocalStorage(): void {
  const userDataKeys = [
    'user',
    'likedMemes', 
    'savedMemes',
    'theme',
    'settings'
  ];
  
  try {
    userDataKeys.forEach(key => {
      localStorage.removeItem(key);
      delete memoryCache[key];
      delete lastReadTime[key];
    });
  } catch (error) {
    console.error('Failed to clear user data from localStorage:', error);
  }
}

export function clearAllStorageData(): void {
  invalidateAllCache();
  clearAllLocalStorage();
}