import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useMemeContentStore } from "../store/useMemeContentStore"
import { useUserStore } from "../store/useUserStore"
import { toast } from "react-hot-toast"
import { useNavigate, useParams } from "react-router-dom"
import { ProfileHeader } from "../components/profile/ProfileHeader"
import { ProfileTabs } from "../components/profile/ProfileTabs"
import { EditProfileModal } from "../components/profile/EditProfileModal"
import { FollowersModal } from "../components/profile/FollowersModal"
import { FollowingModal } from "../components/profile/FollowingModal"
import { MemeCard } from "../components/mainPage/MemeCard"
import { TrueMasonryGrid } from "../components/mainPage/TrueMasonryGrid"
import { SkeletonCard } from "../components/ui/SkeletonCard"


type TabType = "uploaded" | "liked" | "saved"

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { username } = useParams<{ username: string }>()
  const getLoggedInUser = useUserStore.use.getLoggedInUser()
  const loggedInUser = getLoggedInUser()
  const isOwnProfile = loggedInUser.username === username
  const memeList = useMemeContentStore.use.memeList()
  const likedMemes = useMemeContentStore.use.likedMemes()
  const savedMemes = useMemeContentStore.use.savedMemes()
  const isLoading = useMemeContentStore.use.isLoading()
  const fetchUserProfile = useUserStore.use.fetchUserProfile()
  const clearViewedProfile = useUserStore.use.clearViewedProfile()
  const updateUserProfile = useUserStore.use.updateUserProfile()
  const fetchFollowData = useUserStore.use.fetchFollowData()
  
  const loggedInUserProfilePictureUrl = useUserStore.use.loggedInUserProfilePictureUrl()
  const loggedInUserProfileBannerUrl = useUserStore.use.loggedInUserProfileBannerUrl()
  const loggedInUserName = useUserStore.use.loggedInUserName()
  const loggedInUserFollowers = useUserStore.use.loggedInUserFollowers()
  const loggedInUserFollowing = useUserStore.use.loggedInUserFollowing()

  
  const viewedUserProfile = useUserStore.use.viewedUserProfile()
  const viewedUserName = useUserStore.use.viewedUserName()
  const viewedUserFollowers = useUserStore.use.viewedUserFollowers()
  const viewedUserFollowing = useUserStore.use.viewedUserFollowing()

  const [activeTab, setActiveTab] = useState<TabType>("uploaded")
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false)
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false)
  const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null)
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalMemes, setTotalMemes] = useState(0)
  
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const profileLoadingInitiatedRef = useRef(false)
  const [displayedUsername, setDisplayedUsername] = useState<string | null>(null)

  const currentFollowers = isOwnProfile ? loggedInUserFollowers : viewedUserFollowers
  const currentFollowing = isOwnProfile ? loggedInUserFollowing : viewedUserFollowing
  
  useEffect(() => {
    if (!isOwnProfile && (activeTab === "liked" || activeTab === "saved")) {
      setActiveTab("uploaded")
    }
  }, [isOwnProfile, activeTab])
  
  useEffect(() => {
    if (username && !isLoading && profileLoadingInitiatedRef.current) {
      setOffset(0);
      setHasMore(true);
      
      fetchMemesByTab(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!loadMoreRef.current || isLoadingMore || !hasMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMoreMemes();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loadMoreRef.current);
    
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMoreRef.current, isLoadingMore, hasMore, activeTab, offset]);

  useEffect(() => {
    if (!username) return

    if (displayedUsername && displayedUsername !== username) {
            
      clearViewedProfile()
      
      useMemeContentStore.setState({
        memeList: [],
        likedMemes: [],
        savedMemes: [],
      })
      
      setOffset(0);
      setHasMore(true);
      setTotalMemes(0);
      
      useUserStore.getState().invalidateProfileCache(displayedUsername);
    }

    if (displayedUsername !== username) {
      setDisplayedUsername(username)
      profileLoadingInitiatedRef.current = false
    }

    if (profileLoadingInitiatedRef.current) return

    profileLoadingInitiatedRef.current = true
    
    fetchUserProfile(username).then(() => {
      fetchMemesByTab(activeTab);
    });

    return () => {
      profileLoadingInitiatedRef.current = false
    }
  }, [
    fetchUserProfile,
    clearViewedProfile,
    username,
    isOwnProfile,
  ])

  useEffect(() => {
    if (!username) return;

    if (displayedUsername && displayedUsername !== username) {
      useUserStore.setState(state => ({
        ...state,
        loggedInUserFollowers: [],
        loggedInUserFollowing: [],
        viewedUserFollowers: [],
        viewedUserFollowing: []
      }));
    }
  }, [username, displayedUsername]);

  const currentMemes =
    activeTab === "uploaded" ? memeList || [] : activeTab === "liked" ? likedMemes || [] : savedMemes || []

  const fetchMemesByTab = async (tab: TabType, offsetValue: number = 0, loadingMore: boolean = false) => {
    if (!username) return;
    
    const tabTypeMap: Record<TabType, string> = {
      uploaded: "UPLOAD",
      liked: "LIKE",
      saved: "SAVE"
    };
    
    const type = tabTypeMap[tab];
    const limit = 10;
    
    if (loadingMore) {
      setIsLoadingMore(true);
    }
    
    try {
      let userId;
      
      if (isOwnProfile) {
        userId = loggedInUser.userId;
      } else {
        userId = viewedUserFollowers.find(f => f.username === username)?.userId || username;
      }
      
      if (!userId) {
        return;
      }
            
      const result = await useMemeContentStore.getState().fetchUserMemes(
        userId,
        offsetValue,
        limit,
        type
      );
      
      if (result) {
        setHasMore(result.hasMore);
        setTotalMemes(result.total);
        
        if (!loadingMore) {
          setOffset(result.memes.length);
        } else {
          setOffset(prev => prev + result.memes.length);
        }
      }
    } catch (error) {
      toast.error("Failed to load memes");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadMoreMemes = () => {
    if (isLoadingMore || !hasMore) return;
    fetchMemesByTab(activeTab, offset, true);
  };

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return

    setOffset(0);
    setHasMore(true);
    setTotalMemes(0);
    
    setActiveTab(tab)
    
    fetchMemesByTab(tab, 0, false);
  }

  const handleProfilePictureUpload = async (file: File) => {
    try {
      await updateUserProfile(loggedInUser.userId, { profilePicture: file });
      fetchUserProfile(username || "");
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile picture");
    }
  }
  
  const handleProfileBannerUpload = async (file: File) => {
    try {
      await updateUserProfile(loggedInUser.userId, { profileBanner: file });
      fetchUserProfile(username || "");
      toast.success("Banner image updated successfully!");
    } catch (error) {
      toast.error("Failed to update banner image");
    }
  }

  const handleUpdateProfile = async (name: string) => {
    try {
      if (name !== loggedInUserName) {
        const oldUsername = loggedInUserName;        
        await updateUserProfile(loggedInUser.userId, { username: name });
        useUserStore.getState().invalidateProfileCache(oldUsername);
        
        navigate(`/profile/${name}`);
        
        setTimeout(() => {
          fetchUserProfile(name);
        }, 100);
      }
    } catch (error) {      
      const errorMessage = (error as Error).message || useUserStore.getState().error || "Failed to update username";
      toast.error(errorMessage);
      
    }
  }

  const openFollowersModal = async () => {
    setFollowersLoading(true)
    setIsFollowersModalOpen(true)
    
    try {
      let userId;
      
      if (isOwnProfile) {
        userId = loggedInUser.userId;
      } else {
        if (viewedUserProfile?.userId) {
          userId = viewedUserProfile.userId;
        } else if (username) {
          await fetchUserProfile(username);
          
          const updatedState = useUserStore.getState();
          userId = updatedState.viewedUserProfile?.userId;
        }
      }
      
      if (!userId) {
        toast.error("Unable to load followers at this time");
        return;
      }
      
      const existingFollowers = isOwnProfile ? loggedInUserFollowers : viewedUserFollowers;
      
      if (!existingFollowers || existingFollowers.length === 0) {        
        const response = await fetchFollowData(userId, 'followers', 0, 50);
        
        if (response && response.followers && Array.isArray(response.followers)) {          
          useUserStore.setState(state => {
            if (isOwnProfile) {
              state.loggedInUserFollowersCount = response.followersCount ?? 0;
              state.loggedInUserFollowers = response.followers ?? [];
            } else {
              state.viewedUserFollowersCount = response.followersCount ?? 0;
              state.viewedUserFollowers = response.followers ?? [];
            }
            return state;
          });
        }
      }
    } catch (error) {} finally {
      setFollowersLoading(false);
    }
  }

  const openFollowingModal = async () => {
    setFollowingLoading(true)
    setIsFollowingModalOpen(true)
    
    try {
      let userId;
      
      if (isOwnProfile) {
        userId = loggedInUser.userId;
      } else {
        if (viewedUserProfile?.userId) {
          userId = viewedUserProfile.userId;
        } else if (username) {
          await fetchUserProfile(username);
          const updatedState = useUserStore.getState();
          userId = updatedState.viewedUserProfile?.userId;
        }
      }
      
      if (!userId) {
        toast.error("Unable to load following at this time");
        return;
      }
      
      const existingFollowing = isOwnProfile ? loggedInUserFollowing : viewedUserFollowing;
      
      if (!existingFollowing || existingFollowing.length === 0) {
        const response = await fetchFollowData(userId, 'following', 0, 50);
        
        // Check if the response has the expected structure
        if (response && response.following && Array.isArray(response.following)) {
          useUserStore.setState(state => {
            if (isOwnProfile) {
              state.loggedInUserFollowingCount = response.followingCount ?? 0;
              state.loggedInUserFollowing = response.following ?? [];
            } else {
              state.viewedUserFollowingCount = response.followingCount ?? 0;
              state.viewedUserFollowing = response.following ?? [];
            }
            return state;
          });
        } 
      }
    } catch (error) {} finally {
      setFollowingLoading(false);
    }
  }

  const navigateToProfile = (username: string) => {
    navigate(`/profile/${username}`)
    setIsFollowersModalOpen(false)
    setIsFollowingModalOpen(false)
  }
  const renderSkeletonCards = () => {
    return Array.from({ length: 9 }, (_, index) => (
      <SkeletonCard key={`skeleton-${index}`} index={index} />
    ));
  };

  const isCorrectProfileLoaded = isOwnProfile ? !!loggedInUserName : viewedUserName === username
  const showFullPageLoading = isLoading && !isCorrectProfileLoaded

  if (showFullPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-900 profile-page overflow-auto scrollbar-hide">
      <ProfileHeader
        onEditProfile={() => setIsEditProfileModalOpen(true)}
        onOpenFollowers={openFollowersModal}
        onOpenFollowing={openFollowingModal}
      />

      <ProfileTabs activeTab={activeTab} isOwnProfile={isOwnProfile} onTabChange={handleTabChange} />
      
      {totalMemes > 0 && currentMemes.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <p className="text-sm text-gray-500 text-right">
            Showing {currentMemes.length} of {totalMemes} {activeTab} memes
          </p>
        </div>
      )}

        <div
          className="pl-5 sm:pl-6 pt-2 pr-2"
        >
          {isLoading ? (
            <TrueMasonryGrid className="px-1 sm:px-2">
              {renderSkeletonCards()}
            </TrueMasonryGrid>
          ) : (
            <>
              <TrueMasonryGrid className="px-1 sm:px-2">
                {currentMemes.map((meme, index) => (
                  <div
                    key={meme.id}
                    className=""
                    style={{
                      opacity: 1,
                      transform: 'translateY(0px)',
                      zIndex: 2,
                    }}
                    >
                    <MemeCard
                      meme={meme}
                      activeOptionsId={activeOptionsId}
                      onOptionsClick={setActiveOptionsId}
                      activeTab={activeTab}
                    />
                  </div>
                ))}
                {currentMemes.length === 0 && !isLoading && !isLoadingMore && (
                  <div className="w-full h-[60vh] flex items-center justify-center">
                    <p className="text-gray-500 text-base sm:text-lg text-center">
                      No memes found in this section
                    </p>
                  </div>
                )}                
                {isLoadingMore && (
                  <div className="col-span-full flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </TrueMasonryGrid>              
              {hasMore && currentMemes.length > 0 && !isLoadingMore && (
                <div 
                  ref={loadMoreRef} 
                  className="h-20 w-full flex items-center justify-center my-4"
                >
                  <div className="h-1 w-full"></div>
                </div>
              )}
              {!hasMore && currentMemes.length > 0 && !isLoadingMore && (
                <div className="text-center mt-4 text-slate-600 dark:text-slate-400">
                  <p>You've seen all the {activeTab} memes!</p>
                </div>
              )}
            </>
          )}
        </div>

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSave={handleUpdateProfile}
        onUpdateProfilePicture={handleProfilePictureUpload}
        onUpdateProfileBanner={handleProfileBannerUpload}
        currentName={loggedInUserName || ""}
        currentProfilePicture={loggedInUserProfilePictureUrl}
        currentProfileBanner={loggedInUserProfileBannerUrl}
      />

      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        followers={currentFollowers}
        isLoading={followersLoading}
        onNavigateToProfile={navigateToProfile}
      />

      <FollowingModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        following={currentFollowing}
        isLoading={followingLoading}
        onNavigateToProfile={navigateToProfile}
      />
    </div>
  )
}

export default ProfilePage