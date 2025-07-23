import type React from "react";
import { useEffect, useState } from "react";
import { Edit2, UserPlus, UserCheck, Settings} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserStore } from "../../store/useUserStore";
import { useMemeContentStore } from "../../store/useMemeContentStore";
import { toast } from "react-hot-toast";

interface ProfileHeaderProps {
  onEditProfile: () => void;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  onEditProfile,
  onOpenFollowers,
  onOpenFollowing,
}) => {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const [followersLoading, setFollowersLoading] = useState(false);
  
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwnProfile = loggedInUser.username === username;

  const loggedInUserProfilePictureUrl = useUserStore.use.loggedInUserProfilePictureUrl();
  const loggedInUserProfileBannerUrl = useUserStore.use.loggedInUserProfileBannerUrl();
  const loggedInUserName = useUserStore.use.loggedInUserName();
  const loggedInUserFollowersCount = useUserStore.use.loggedInUserFollowersCount();
  const loggedInUserFollowingCount = useUserStore.use.loggedInUserFollowingCount();
  const loggedInUserFollowers = useUserStore.use.loggedInUserFollowers();
  
  const viewedUserProfilePictureUrl = useUserStore.use.viewedUserProfilePictureUrl();
  const viewedUserProfileBannerUrl = useUserStore.use.viewedUserProfileBannerUrl();
  const viewedUserName = useUserStore.use.viewedUserName();
  const viewedUserFollowersCount = useUserStore.use.viewedUserFollowersCount();
  const viewedUserFollowingCount = useUserStore.use.viewedUserFollowingCount();
  const viewedUserFollowers = useUserStore.use.viewedUserFollowers();
  const viewedUserProfile = useUserStore.use.viewedUserProfile();
  const isFollowingViewedUser = useUserStore.use.isFollowingViewedUser();
  
  const updateViewedProfileFollowState = useUserStore.use.updateViewedProfileFollowState();
  
  const memeList = useMemeContentStore.use.memeList();
  
  const handleFollowToggle = useUserStore.use.handleFollowToggle();
  
  const displayName = isOwnProfile ? loggedInUserName : viewedUserName;
  const displayPicture = isOwnProfile ? loggedInUserProfilePictureUrl : viewedUserProfilePictureUrl;
  const displayBanner = isOwnProfile ? loggedInUserProfileBannerUrl : viewedUserProfileBannerUrl;
  const followersCount = isOwnProfile ? loggedInUserFollowersCount : viewedUserFollowersCount;
  const followingCount = isOwnProfile ? loggedInUserFollowingCount : viewedUserFollowingCount;
  const memeCount = memeList?.length || 0;
  
  const [isUserFollowingState, setIsUserFollowingState] = useState(false);
  const [isViewedProfileFollowingUserState, setIsViewedProfileFollowingUserState] = useState(false);
  
  useEffect(() => {
    const checkIsFollowing = () => {
      if (!username || isOwnProfile || !Array.isArray(viewedUserFollowers)) return false;
      return viewedUserFollowers.some((follower) => follower.userId === loggedInUser.userId);
    };
    
    const checkIsFollowedBy = () => {
      if (!username || isOwnProfile || !Array.isArray(loggedInUserFollowers)) return false;
      return loggedInUserFollowers.some((follower) => {
        const viewedUserFollower = viewedUserFollowers.find(f => f.username === username);
        return follower.userId === viewedUserFollower?.userId;
      });
    };
    
    setIsUserFollowingState(checkIsFollowing());
    setIsViewedProfileFollowingUserState(checkIsFollowedBy());
  }, [username, isOwnProfile, viewedUserFollowers, loggedInUserFollowers, loggedInUser.userId]);
  
  const isUserFollowing = () => isUserFollowingState || isFollowingViewedUser;
  const isViewedProfileFollowingUser = () => isViewedProfileFollowingUserState;
  
  const followed = viewedUserProfile?.followed;
  const followback = viewedUserProfile?.followback;

  const onFollow = async () => {
    if (!username || isOwnProfile) return;

    const isFollowing = isFollowingViewedUser || followed || isUserFollowing();
    
    setFollowersLoading(true);

    try {
      if (isFollowing) {
        toast.success("Unfollowing user...");
      } else if (followback || isViewedProfileFollowingUser()) {
        toast.success("Following back...");
      } else {
        toast.success("Following user...");
      }

      updateViewedProfileFollowState(!isFollowing);
      
      const newFollowersCount = !isFollowing 
        ? (viewedUserFollowersCount + 1)
        : Math.max(0, viewedUserFollowersCount - 1);
        
      useUserStore.setState(state => {
        state.viewedUserFollowersCount = newFollowersCount;
        if (state.viewedUserProfile) {
          state.viewedUserProfile.followersCount = newFollowersCount;
          state.viewedUserProfile.followed = !isFollowing;
        }
        if (state.viewedUserName && state.profileCache[state.viewedUserName]) {
          state.profileCache[state.viewedUserName].profile.followersCount = newFollowersCount;
          state.profileCache[state.viewedUserName].profile.followed = !isFollowing;
        }
        state.isFollowingViewedUser = !isFollowing;
        return state;
      });

      await handleFollowToggle(isFollowing);
      
    } catch (error) {
      toast.error("Failed to update follow status");
      
      updateViewedProfileFollowState(isFollowing);
      
      const originalFollowersCount = isFollowing 
        ? viewedUserFollowersCount
        : Math.max(0, viewedUserFollowersCount - 1);
        
      useUserStore.setState(state => {
        state.viewedUserFollowersCount = originalFollowersCount;
        if (state.viewedUserProfile) {
          state.viewedUserProfile.followersCount = originalFollowersCount;
          state.viewedUserProfile.followed = isFollowing;
        }
        if (state.viewedUserName && state.profileCache[state.viewedUserName]) {
          state.profileCache[state.viewedUserName].profile.followersCount = originalFollowersCount;
          state.profileCache[state.viewedUserName].profile.followed = isFollowing;
        }
        state.isFollowingViewedUser = isFollowing;
        return state;
      });
    } finally {
      setFollowersLoading(false);
    }
  };

  useEffect(() => {
    
  }, [
    followersCount, 
    followingCount, 
    displayBanner, 
    followed, 
    followback, 
    isFollowingViewedUser, 
    viewedUserFollowers, 
    loggedInUserFollowers,
    viewedUserProfile,
    username
  ]);

  return (
    <div className="relative bg-white dark:bg-gray-900 shadow-sm pb-4">
      <div className="relative h-32 sm:h-48 md:h-60 overflow-hidden">
        {displayBanner ? (
          <div className="absolute inset-0">
            <img
              src={displayBanner}
              alt="Profile Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 opacity-20"></div>
          </div>
        ) : (
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: `url("data:image/svg+xml;base64,${btoa(`
        <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
          <rect width='100%' height='100%' fill='#dbeafe'/>
          <circle cx='50%' cy='50%' r='80' fill='#3b82f6' opacity='0.15'/>
          <circle cx='30%' cy='30%' r='40' fill='#1e3a8a' opacity='0.1'/>
        </svg>
      `)}")`,
            }}
          />
        )}

      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="relative -mt-16 sm:-mt-20 md:-mt-24 mb-4 flex justify-between">
          <div className="relative group">
            <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 bg-white rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-md overflow-hidden">
              {displayPicture ? (
                <img
                  src={displayPicture || "/placeholder.svg"}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl sm:text-5xl font-bold text-blue-600">
                  {displayName?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2 mt-4 sm:mt-16">
            {isOwnProfile ? (
              <>
                <div className="sm:hidden flex space-x-2">
                  <button
                    onClick={onEditProfile}
                    className="bg-white hover:bg-white text-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-800 dark:text-gray-200 py-1.5 px-3 rounded-full flex items-center justify-center space-x-1 transition-colors shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate("/settings")}
                    className="bg-white hover:bg-white text-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-800 dark:text-gray-200 p-2 rounded-full flex items-center justify-center transition-colors shadow-sm border border-gray-200 dark:border-gray-700"
                    aria-label="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={onEditProfile}
                  className="hidden sm:flex bg-white hover:bg-white text-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-800 dark:text-gray-200 py-2 px-4 rounded-full items-center space-x-2 transition-colors shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <Edit2 className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>
              </>
            ) : (
              <button
                onClick={onFollow}
                disabled={followersLoading}
                className={`${
                  isFollowingViewedUser || followed || isUserFollowing()
                    ? "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    : "bg-white hover:bg-white text-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-800 dark:text-gray-200"
                } py-2 px-4 rounded-full flex items-center justify-center space-x-2 transition-colors shadow-sm border border-gray-200 dark:border-gray-700 ${
                  followersLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                data-testid="follow-button"
                data-following={isFollowingViewedUser || followed || isUserFollowing() ? "true" : "false"}
                data-followback={followback || isViewedProfileFollowingUser() ? "true" : "false"}
              >
                {followersLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : isFollowingViewedUser || followed || isUserFollowing() ? (
                  <>
                    <UserCheck className="w-5 h-5" />
                    <span>Following</span>
                  </>
                ) : followback || isViewedProfileFollowingUser() ? (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Follow Back</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 sm:mt-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {displayName || "User"}
          </h1>

          <div className="mt-3 flex flex-wrap items-center text-gray-600 dark:text-gray-300 gap-4 sm:gap-6">
            <div className="flex items-center">
              <span className="font-semibold text-gray-900 dark:text-white">
                {memeCount}
              </span>
              <span className="ml-1 text-sm">Uploads</span>
            </div>

            <button
              onClick={onOpenFollowers}
              className="flex items-center hover:underline"
              data-testid="followers-count"
            >
              <span className="font-semibold text-gray-900 dark:text-white">
                {followersCount}
              </span>
              <span className="ml-1 text-sm">Followers</span>
            </button>

            <button
              onClick={onOpenFollowing}
              className="flex items-center hover:underline"
              data-testid="following-count"
            >
              <span className="font-semibold text-gray-900 dark:text-white">
                {followingCount}
              </span>
              <span className="ml-1 text-sm">Following</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
