import { useEffect, useRef } from 'react';
import { useUserStore } from '../../store/useUserStore.ts';
import { useAuthContext } from '../../hooks/useAuthContext';


export const UserProfileInitializer: React.FC = () => {
  const isInitializedRef = useRef(false);
  
  const fetchUserProfile = useUserStore.use.fetchUserProfile();
  const isLoggedInUserProfileLoaded = useUserStore.use.isLoggedInUserProfileLoaded();
  const { username, isAuthenticated } = useAuthContext();
  
  useEffect(() => {
    const initializeUserProfile = async () => {
      try {
        const path = window.location.pathname;
        const isProfilePage = path.startsWith('/profile/');
        
        if (isProfilePage) {
          return;
        }
                
        if (!isAuthenticated || !username) return;
        
        const profileCache = useUserStore.getState().profileCache;
        const cachedProfile = profileCache[username];
        const isCacheValid = cachedProfile && 
                            (Date.now() - cachedProfile.timestamp < 5 * 60 * 1000);
        
        if (!isLoggedInUserProfileLoaded && !isCacheValid) {
          await fetchUserProfile(username);
        }
      } catch (error) {
      }
    };
    
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      initializeUserProfile();
    }
  }, [fetchUserProfile, isLoggedInUserProfileLoaded, isAuthenticated, username]);
  
  return null;
};