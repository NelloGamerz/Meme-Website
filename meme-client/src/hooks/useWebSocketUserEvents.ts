import { useEffect } from 'react';
import { useWebSocketEvent } from '../services/WebSocketEventBus';
import { WebSocketMessage } from '../services/WebSocketService';
import { getCurrentAuthUser } from '../utils/authHelpers';

const getCurrentUser = () => {
  const authUser = getCurrentAuthUser();
  return authUser ? { username: authUser.username } : { username: '' };
};

const getUserStore = async () => {
  const { useUserStore } = await import('../store/useUserStore');
  return useUserStore;
};

export const useWebSocketUserEvents = () => {
  useWebSocketFollowEvents();
};

export const useWebSocketFollowEvents = () => {
  useEffect(() => {
    const unsubscribe = useWebSocketEvent("FOLLOW", async (message: WebSocketMessage) => {
      const currentUser = getCurrentUser();
      const userStore = await getUserStore();
      const set = userStore.setState;

      const {
        followerUsername,
        followingUsername,
        isFollowing,
        profilePictureUrl
      } = message;

      const isCurrentUserFollower = followerUsername === currentUser.username;
      const isCurrentUserFollowed = followingUsername === currentUser.username;

      if (isCurrentUserFollower) {
        userStore.getState().updateFollowingState(
          followingUsername as string,
          isFollowing as boolean,
          (profilePictureUrl as string) || ""
        );
      }

      if (isCurrentUserFollowed) {
        userStore.getState().updateFollowerState(
          followerUsername as string,
          isFollowing as boolean,
          (profilePictureUrl as string) || ""
        );
      }

      const viewedUsername = userStore.getState().viewedUserName;
      const currentState = userStore.getState();

      if (isCurrentUserFollower && viewedUsername === followingUsername) {

        userStore.getState().updateViewedProfileFollowState(Boolean(isFollowing));

        const newFollowersCount = isFollowing
          ? currentState.viewedUserFollowersCount + 1
          : Math.max(0, currentState.viewedUserFollowersCount - 1);

        set((state) => ({
          ...state,
          viewedUserFollowersCount: newFollowersCount,
          viewedUserProfile: state.viewedUserProfile
            ? { ...state.viewedUserProfile, followersCount: newFollowersCount }
            : state.viewedUserProfile,
        }));
      }

      else if (isCurrentUserFollowed && viewedUsername === followerUsername) {

        const newFollowingCount = isFollowing
          ? currentState.viewedUserFollowingCount + 1
          : Math.max(0, currentState.viewedUserFollowingCount - 1);

        set((state) => ({
          ...state,
          viewedUserFollowingCount: newFollowingCount,
          viewedUserProfile: state.viewedUserProfile
            ? { ...state.viewedUserProfile, followingCount: newFollowingCount }
            : state.viewedUserProfile,
        }));
      }

      else if (isCurrentUserFollower || isCurrentUserFollowed) {

        const newFollowingCount = isCurrentUserFollower
          ? (isFollowing
              ? currentState.loggedInUserFollowingCount + 1
              : Math.max(0, currentState.loggedInUserFollowingCount - 1))
          : currentState.loggedInUserFollowingCount;

        const newFollowersCount = isCurrentUserFollowed
          ? (isFollowing
              ? currentState.loggedInUserFollowersCount + 1
              : Math.max(0, currentState.loggedInUserFollowersCount - 1))
          : currentState.loggedInUserFollowersCount;

        set((state) => ({
          ...state,
          loggedInUserFollowingCount: newFollowingCount,
          loggedInUserFollowersCount: newFollowersCount,
        }));
      }

      setTimeout(() => {
        set((state) => ({ ...state }));
      }, 50);
    });

    return () => {
      unsubscribe();
    };
  }, []);
};
