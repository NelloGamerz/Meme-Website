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
  userId: string;
  username: string;
  profilePicture?: string;
  email?: string;
  name?: string;
} {
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