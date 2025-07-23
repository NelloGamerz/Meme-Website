import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import api from "../hooks/api";
import type { ApiMeme, Followers, Following, Meme } from "../types/mems";

interface UserProfile {
  userId: string;
  username: string;
  profilePictureUrl: string;
  profileBannerUrl: string;
  followersCount: number;
  followingCount: number;
  userCreated: Date;
  followers: Followers[];
  following: Following[];
  likedMemes: Meme[];
  savedMemes: Meme[];
  memeList: Meme[];
  followed?: boolean;
  followback?: boolean;
  isOwnProfile?: boolean;
}

interface CachedUserProfile {
  userId: string;
  username: string;
  profilePictureUrl: string;
  profileBannerUrl: string;
  followersCount: number;
  followingCount: number;
  userCreated: Date;
  followed?: boolean;
  followback?: boolean;
  isOwnProfile?: boolean;
}

let currentAuthUser: {
  userId: string;
  username: string;
} | null = null;

const setCurrentAuthUser = (authUser: { userId: string; username: string } | null) => {
  currentAuthUser = authUser;
};

const getCurrentAuthUser = (): {
  userId: string;
  username: string;
  profilePicture?: string;
  profileBanner?: string;
  name?: string;
} => {
  try {
    const { useAuthStore } = require("./useAuthStore");
    const authUser = useAuthStore.getState().getCurrentUser();
    if (authUser) {
      return {
        userId: authUser.userId,
        username: authUser.username,
        profilePicture: authUser.profilePicture,
        name: authUser.name,
      };
    }
  } catch (error) {
  }
  
  if (currentAuthUser) {
    return {
      userId: currentAuthUser.userId,
      username: currentAuthUser.username,
    };
  }
  
  return {
    userId: "",
    username: "",
  };
};

interface UserState {
  loggedInUserProfile: UserProfile | null;
  isLoggedInUserProfileLoaded: boolean;
  loggedInUserProfilePictureUrl: string;
  loggedInUserProfileBannerUrl: string;
  loggedInUserName: string;
  loggedInUserCreated: Date;
  loggedInUserFollowersCount: number;
  loggedInUserFollowingCount: number;
  loggedInUserFollowers: Followers[];
  loggedInUserFollowing: Following[];
  loggedInUserLikedMemes: Meme[];
  loggedInUserSavedMemes: Meme[];
  loggedInUserMemeList: Meme[];

  viewedUserProfile: UserProfile | null;
  viewedUserProfilePictureUrl: string;
  viewedUserProfileBannerUrl: string;
  viewedUserName: string;
  viewedUserCreated: Date;
  viewedUserFollowersCount: number;
  viewedUserFollowingCount: number;
  viewedUserFollowers: Followers[];
  viewedUserFollowing: Following[];
  viewedUserLikedMemes: Meme[];
  viewedUserSavedMemes: Meme[];
  viewedUserMemeList: Meme[];

  isFollowingViewedUser: boolean;

  profileCache: Record<
    string,
    {
      profile: CachedUserProfile;
      timestamp: number;
    }
  >;

  isLoading: boolean;
  error: string | null;

  profilePictureUrl: string;
  userName: string;
  userCreated: Date;
  followersCount: number;
  followingCount: number;
  Followers: Followers[];
  Following: Following[];
  likedMemes: Meme[];
  savedMemes: Meme[];
  memeList: Meme[];
}

interface UserActions {
  fetchUserProfile: (username: string) => Promise<void>;
  updateProfilePicture: (file: File, userId: string) => Promise<void>;
  updateUserName: (userId: string, newUsername: string) => Promise<void>;
  updateUserProfile: (
    userId: string,
    data: {
      username?: string;
      profilePicture?: File;
      profileBanner?: File;
    }
  ) => Promise<void>;

  setAuthUser: (authUser: { userId: string; username: string } | null) => void;
  handleAuthStateChange: (authUser: { userId: string; username: string } | null) => Promise<void>;

  getLoggedInUser: () => {
    userId: string;
    username: string;
    profilePicture?: string;
    profileBanner?: string;
    name?: string;
  };

  handleFollowToggle: (isFollowing: boolean) => Promise<void>;
  addFollower: (follower: Followers) => void;
  removeFollower: (userId: string) => void;
  fetchFollowData: (
    userId: string,
    type: "followers" | "following",
    offset: number,
    limit: number
  ) => Promise<{
    followers?: Followers[];
    following?: Following[];
    followersCount?: number;
    followingCount?: number;
    offset: number;
    limit: number;
  }>;

  updateFollowingState: (
    followingUserId: string,
    followingUsername: string,
    isFollowing: boolean,
    profilePictureUrl: string
  ) => void;
  updateFollowerState: (
    followerId: string,
    followerUsername: string,
    isFollowing: boolean,
    profilePictureUrl: string
  ) => void;
  updateViewedProfileFollowState: (isFollowing: boolean) => void;
  updateViewedProfileCounts: () => void;

  clearViewedProfile: () => void;
  invalidateProfileCache: (username: string) => void;
}

type UserStore = UserState & UserActions;

const useRawUserStore = create<UserStore>()(
  immer((set, get) => ({
    loggedInUserProfile: null,
    isLoggedInUserProfileLoaded: false,
    loggedInUserProfilePictureUrl: "",
    loggedInUserProfileBannerUrl: "",
    loggedInUserName: getCurrentAuthUser().username || "",
    loggedInUserCreated: new Date(),
    loggedInUserFollowersCount: 0,
    loggedInUserFollowingCount: 0,
    loggedInUserFollowers: [],
    loggedInUserFollowing: [],
    loggedInUserLikedMemes: [],
    loggedInUserSavedMemes: [],
    loggedInUserMemeList: [],

    viewedUserProfile: null,
    viewedUserProfilePictureUrl: "",
    viewedUserProfileBannerUrl: "",
    viewedUserName: "",
    viewedUserCreated: new Date(),
    viewedUserFollowersCount: 0,
    viewedUserFollowingCount: 0,
    viewedUserFollowers: [],
    viewedUserFollowing: [],
    viewedUserLikedMemes: [],
    viewedUserSavedMemes: [],
    viewedUserMemeList: [],

    isFollowingViewedUser: false,

    profileCache: {},
    isLoading: false,
    error: null,

    get profilePictureUrl() {
      const state = get();
      return (
        state.loggedInUserProfilePictureUrl || state.viewedUserProfilePictureUrl
      );
    },

    get profileBannerUrl() {
      const state = get();
      return (
        state.loggedInUserProfileBannerUrl || state.viewedUserProfileBannerUrl
      );
    },

    get userName() {
      const state = get();
      return state.loggedInUserName || state.viewedUserName;
    },

    get userCreated() {
      const state = get();
      return state.loggedInUserCreated || state.viewedUserCreated;
    },

    get followersCount() {
      const state = get();
      return state.viewedUserFollowersCount || state.loggedInUserFollowersCount;
    },

    get followingCount() {
      const state = get();
      return state.viewedUserFollowingCount || state.loggedInUserFollowingCount;
    },

    get Followers() {
      const state = get();
      return state.viewedUserFollowers.length > 0
        ? state.viewedUserFollowers
        : state.loggedInUserFollowers;
    },

    get Following() {
      const state = get();
      return state.viewedUserFollowing.length > 0
        ? state.viewedUserFollowing
        : state.loggedInUserFollowing;
    },

    get likedMemes() {
      const state = get();
      return state.viewedUserLikedMemes.length > 0
        ? state.viewedUserLikedMemes
        : state.loggedInUserLikedMemes;
    },

    get savedMemes() {
      const state = get();
      return state.viewedUserSavedMemes.length > 0
        ? state.viewedUserSavedMemes
        : state.loggedInUserSavedMemes;
    },

    get memeList() {
      const state = get();
      return state.viewedUserMemeList.length > 0
        ? state.viewedUserMemeList
        : state.loggedInUserMemeList;
    },

    setAuthUser: (authUser: { userId: string; username: string } | null) => {
      setCurrentAuthUser(authUser);
      set((state) => {
        state.loggedInUserName = authUser?.username || "";
      });
    },

    handleAuthStateChange: async (authUser: { userId: string; username: string } | null) => {
      setCurrentAuthUser(authUser);
      set((state) => {
        state.loggedInUserName = authUser?.username || "";
      });

      if (authUser && authUser.username) {
        try {
          await get().fetchUserProfile(authUser.username);
        } catch (error) {
          console.error("Failed to fetch user profile after auth state change:", error);
        }
      }
    },

    getLoggedInUser: () => {
      return getCurrentAuthUser();
    },

    clearViewedProfile: () => {
      set((state) => {
        state.viewedUserProfile = null;
        state.viewedUserProfilePictureUrl = "";
        state.viewedUserProfileBannerUrl = "";
        state.viewedUserName = "";
        state.viewedUserCreated = new Date();
        state.viewedUserFollowersCount = 0;
        state.viewedUserFollowingCount = 0;
        state.viewedUserFollowers = [];
        state.viewedUserFollowing = [];
        state.viewedUserLikedMemes = [];
        state.viewedUserSavedMemes = [];
        state.viewedUserMemeList = [];
        state.isFollowingViewedUser = false;

        state.isLoading = true;
        state.error = null;
      });
    },

    invalidateProfileCache: (username: string) => {
      set((state) => {
        if (username && state.profileCache[username]) {
          delete state.profileCache[username];
        }
      });
    },

    fetchUserProfile: async (username: string) => {
      try {
        const isLoggedInUser = username === getCurrentAuthUser().username;

        if (!isLoggedInUser) {
          set((state) => {
            state.viewedUserProfile = null;
            state.viewedUserProfilePictureUrl = "";
            state.viewedUserName = "";
            state.viewedUserCreated = new Date();
            state.viewedUserFollowersCount = 0;
            state.viewedUserFollowingCount = 0;
            state.viewedUserFollowers = [];
            state.viewedUserFollowing = [];
            state.viewedUserLikedMemes = [];
            state.viewedUserSavedMemes = [];
            state.viewedUserMemeList = [];
            state.isFollowingViewedUser = false;
          });
        }

        const now = Date.now();
        const cachedProfile = get().profileCache[username];

        if (cachedProfile && now - cachedProfile.timestamp < 5 * 60 * 1000) {
          set((state) => {
            if (isLoggedInUser) {
              state.isLoggedInUserProfileLoaded = true;
              state.loggedInUserProfilePictureUrl =
                cachedProfile.profile.profilePictureUrl;
              state.loggedInUserProfileBannerUrl =
                cachedProfile.profile.profileBannerUrl;
              state.loggedInUserName = cachedProfile.profile.username;
              state.loggedInUserCreated = cachedProfile.profile.userCreated;
              state.loggedInUserFollowersCount =
                cachedProfile.profile.followersCount;
              state.loggedInUserFollowingCount =
                cachedProfile.profile.followingCount;

              state.isLoading = true;

              api
                .get(`/profile/${username}?includeMemes=true`)
                .then((response) => {
                  set((state) => {
                    state.loggedInUserFollowers = response.data.followers || [];
                    state.loggedInUserFollowing = response.data.following || [];
                    state.loggedInUserLikedMemes =
                      response.data.likedMemes || [];
                    state.loggedInUserSavedMemes =
                      response.data.savedMemes || [];

                    const mappedMemeList =
                      response.data.memeList?.map(
                        (meme: Partial<Meme> & { mediaUrl?: string }) => {
                          if (meme.url) return meme;
                          if (meme.mediaUrl)
                            return { ...meme, url: meme.mediaUrl };
                          return meme;
                        }
                      ) || [];

                    state.loggedInUserMemeList = mappedMemeList;
                    state.isLoading = false;
                  });
                })
                .catch((error) => {
                  console.error(
                    `Error fetching full profile data for ${username}:`,
                    error
                  );
                  set((state) => {
                    state.isLoading = false;
                  });
                });
            } else {
              state.viewedUserProfilePictureUrl =
                cachedProfile.profile.profilePictureUrl;
              state.viewedUserProfileBannerUrl =
                cachedProfile.profile.profileBannerUrl;
              state.viewedUserName = cachedProfile.profile.username;
              state.viewedUserCreated = cachedProfile.profile.userCreated;
              state.viewedUserFollowersCount =
                cachedProfile.profile.followersCount;
              state.viewedUserFollowingCount =
                cachedProfile.profile.followingCount;
              state.isLoading = true;
              api
                .get(`/profile/${username}?includeMemes=true`)
                .then((response) => {
                  set((state) => {
                    state.viewedUserFollowers = response.data.followers || [];
                    state.viewedUserFollowing = response.data.following || [];
                    state.viewedUserLikedMemes = response.data.likedMemes || [];
                    state.viewedUserSavedMemes = response.data.savedMemes || [];

                    const mappedMemeList =
                      response.data.memeList?.map(
                        (meme: Partial<Meme> & { mediaUrl?: string }) => {
                          if (meme.url) return meme;
                          if (meme.mediaUrl)
                            return { ...meme, url: meme.mediaUrl };
                          return meme;
                        }
                      ) || [];

                    state.viewedUserMemeList = mappedMemeList;

                    const loggedInUser = getCurrentAuthUser();
                    if (
                      loggedInUser.userId &&
                      Array.isArray(response.data.followers)
                    ) {
                      state.isFollowingViewedUser =
                        response.data.followers.some(
                          (follower: Followers) =>
                            follower.userId === loggedInUser.userId
                        );
                    } else {
                      state.isFollowingViewedUser =
                        response.data.followed || false;
                    }

                    state.isLoading = false;
                  });
                })
                .catch((error) => {
                  console.error(
                    `Error fetching full profile data for ${username}:`,
                    error
                  );
                  set((state) => {
                    state.isLoading = false;
                  });
                });
            }
          });

          return;
        }

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const response = await api.get(
          `/profile/${username}`
        );

        const mappedMemeList =
          response.data.memeList?.map(
            (meme: Partial<ApiMeme> & { mediaUrl?: string }) => {

              if (meme.mediaUrl) {
                return {
                  ...meme,
                  url: meme.mediaUrl,
                  title: meme.caption,
                };
              }

              return meme;
            }
          ) || [];

        const userProfile: UserProfile = {
          userId: response.data.userId,
          username: response.data.username,
          profilePictureUrl: response.data.profilePictureUrl,
          profileBannerUrl: response.data.profileBannerUrl,
          followersCount: response.data.followersCount,
          followingCount: response.data.followingCount,
          userCreated: new Date(response.data.userCreated),
          followers: response.data.followers || [],
          following: response.data.following || [],
          likedMemes: response.data.likedMemes || [],
          savedMemes: response.data.savedMemes || [],
          memeList: mappedMemeList,
          followed: response.data.followed,
          followback: response.data.followback,
          isOwnProfile: isLoggedInUser,
        };

        set((state) => {
          const cachedProfile: CachedUserProfile = {
            userId: userProfile.userId,
            username: userProfile.username,
            profilePictureUrl: userProfile.profilePictureUrl,
            followersCount: userProfile.followersCount,
            followingCount: userProfile.followingCount,
            userCreated: userProfile.userCreated,
            profileBannerUrl: userProfile.profileBannerUrl,
            followed: userProfile.followed,
            followback: userProfile.followback,
            isOwnProfile: userProfile.isOwnProfile,
          };

          state.profileCache[username] = {
            profile: cachedProfile,
            timestamp: now,
          };

          if (isLoggedInUser) {
            state.loggedInUserProfile = userProfile;
            state.isLoggedInUserProfileLoaded = true;
            state.loggedInUserProfilePictureUrl = userProfile.profilePictureUrl;
            state.loggedInUserProfileBannerUrl = userProfile.profileBannerUrl;
            state.loggedInUserName = userProfile.username;
            state.loggedInUserCreated = userProfile.userCreated;
            state.loggedInUserFollowersCount = userProfile.followersCount;
            state.loggedInUserFollowingCount = userProfile.followingCount;
            state.loggedInUserFollowers = userProfile.followers;
            state.loggedInUserFollowing = userProfile.following;
            state.loggedInUserLikedMemes = userProfile.likedMemes;
            state.loggedInUserSavedMemes = userProfile.savedMemes;
            state.loggedInUserMemeList = userProfile.memeList;
          } else {
            state.viewedUserProfile = userProfile;
            state.viewedUserProfilePictureUrl = userProfile.profilePictureUrl;
            state.viewedUserProfileBannerUrl = userProfile.profileBannerUrl;
            state.viewedUserName = userProfile.username;
            state.viewedUserCreated = userProfile.userCreated;
            state.viewedUserFollowersCount = userProfile.followersCount;
            state.viewedUserFollowingCount = userProfile.followingCount;
            state.viewedUserFollowers = userProfile.followers;
            state.viewedUserFollowing = userProfile.following;
            state.viewedUserLikedMemes = userProfile.likedMemes;
            state.viewedUserSavedMemes = userProfile.savedMemes;
            state.viewedUserMemeList = userProfile.memeList;

            const loggedInUser = getCurrentAuthUser();
            if (userProfile.followed !== undefined) {
              state.isFollowingViewedUser = userProfile.followed;
            } else if (
              loggedInUser.userId &&
              Array.isArray(userProfile.followers)
            ) {
              state.isFollowingViewedUser = userProfile.followers.some(
                (follower: Followers) => follower.userId === loggedInUser.userId
              );
            } else {
              state.isFollowingViewedUser = false;
            }
          }

          state.isLoading = false;
        });
      } catch (error) {
        console.error(`Error fetching user profile for ${username}:`, error);
        set((state) => {
          state.error = `Failed to fetch user profile for ${username}`;
          state.isLoading = false;
        });
      }
    },

    updateProfilePicture: async (file: File, userId: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);

        const response = await api.post("/profile/profile-picture", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const user = getCurrentAuthUser();
        user.profilePicture = response.data.profilePictureUrl;

        set((state) => {
          state.loggedInUserProfilePictureUrl = response.data.profilePictureUrl;

          if (state.loggedInUserProfile) {
            state.loggedInUserProfile.profilePictureUrl =
              response.data.profilePictureUrl;
          }

          if (state.profileCache[user.username]) {
            state.profileCache[user.username].profile.profilePictureUrl =
              response.data.profilePictureUrl;
          }

          state.isLoading = false;

          state.loggedInUserMemeList.forEach((meme) => {
            if (meme.userId === userId) {
              meme.profilePictureUrl = response.data.profilePictureUrl;
            }
          });

          state.isLoading = false;
        });
      } catch (error) {
        console.error("Error updating profile picture:", error);
        set((state) => {
          state.error = "Failed to update profile picture";
          state.isLoading = false;
        });
      }
    },

    updateUserName: async (userId: string, newUsername: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        await api.put(`/profile/${userId}/username`, {
          newUsername,
        });

        const user = getCurrentAuthUser();
        const oldUsername = user.username;
        user.username = newUsername;

        set((state) => {
          state.loggedInUserName = newUsername;

          if (state.loggedInUserProfile) {
            state.loggedInUserProfile.username = newUsername;
          }

          if (state.profileCache[oldUsername]) {
            state.profileCache[newUsername] = {
              ...state.profileCache[oldUsername],
              profile: {
                ...state.profileCache[oldUsername].profile,
                username: newUsername,
              },
            };

            delete state.profileCache[oldUsername];
          }

          state.loggedInUserMemeList.forEach((meme) => {
            if (meme.userId === userId) {
              meme.uploader = newUsername;
            }
          });

          state.isLoading = false;
        });
      } catch (error) {
        console.error("Error updating username:", error);
        set((state) => {
          state.error = "Failed to update username";
          state.isLoading = false;
        });
      }
    },

    updateUserProfile: async (
      userId: string,
      data: {
        username?: string;
        profilePicture?: File;
        profileBanner?: File;
      }
    ) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        let profilePictureUrl: string | null = null;
        let profileBannerUrl: string | null = null;

        const presignRequests = [];

        if (data.profilePicture) {
          presignRequests.push({
            filename: data.profilePicture.name,
            contentType: data.profilePicture.type,
            type: "profile_picture",
          });
        }

        if (data.profileBanner) {
          presignRequests.push({
            filename: data.profileBanner.name,
            contentType: data.profileBanner.type,
            type: "profile_banner",
          });
        }

        let presignedUrls: any[] = [];

        if (presignRequests.length > 0) {
          const res = await api.post("/upload/presign-temp", {
            userId,
            files: presignRequests,
          });
          presignedUrls = res.data;
        }

        for (let i = 0; i < presignedUrls.length; i++) {
          const fileMeta = presignRequests[i];
          const file =
            fileMeta.type === "profile_picture"
              ? data.profilePicture
              : data.profileBanner;
          const presigned = presignedUrls[i];

          if (!file) {
            throw new Error(`File for ${fileMeta.type} is undefined`);
          }
          const uploadRes = await fetch(presigned.uploadedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
            },
            body: file,
          });

          if (!uploadRes.ok) {
            throw new Error(`Failed to upload ${fileMeta.type}`);
          }

          if (fileMeta.type === "profile_picture") {
            profilePictureUrl = presigned.publicUrl;
          } else if (fileMeta.type === "profile_banner") {
            profileBannerUrl = presigned.publicUrl;
          }
        }

        const user = getCurrentAuthUser();
        const oldUsername = user.username;
        
        const payload: any = {
          userId,
        };
        if (data.username) {
          payload.username = data.username;
          payload.previousUsername = oldUsername;
        }
        if (profilePictureUrl) payload.profilePictureUrl = profilePictureUrl;
        if (profileBannerUrl) payload.profileBannerUrl = profileBannerUrl;

        const response = await api.patch(`/upload/profile`, payload);

        if (response.data.newUsername) {
          user.username = response.data.newUsername;
        }

        if (response.data.profilePictureUrl) {
          user.profilePicture = response.data.profilePictureUrl;
        }

        if (response.data.profileBannerUrl) {
          user.profileBanner = response.data.profileBannerUrl;
        }

        set((state) => {
          if (response.data.newUsername) {
            const newUsername = response.data.newUsername;

            state.loggedInUserName = newUsername;

            if (state.loggedInUserProfile) {
              state.loggedInUserProfile.username = newUsername;
            }

            if (state.profileCache[oldUsername]) {
              state.profileCache[newUsername] = {
                ...state.profileCache[oldUsername],
                profile: {
                  ...state.profileCache[oldUsername].profile,
                  username: newUsername,
                },
                timestamp: Date.now(),
              };
              
              delete state.profileCache[oldUsername];
            }
            
            state.profileCache[newUsername] = state.profileCache[newUsername] || {
              profile: {
                userId,
                username: newUsername,
                profilePictureUrl: response.data.profilePictureUrl || state.loggedInUserProfilePictureUrl,
                profileBannerUrl: response.data.profileBannerUrl || state.loggedInUserProfileBannerUrl,
                followersCount: state.loggedInUserFollowersCount,
                followingCount: state.loggedInUserFollowingCount,
                userCreated: state.loggedInUserCreated,
              },
              timestamp: Date.now(),
            };

            state.loggedInUserMemeList.forEach((meme) => {
              if (meme.userId === userId) {
                meme.uploader = newUsername;
              }
            });
          }

          if (response.data.profilePictureUrl) {
            state.loggedInUserProfilePictureUrl =
              response.data.profilePictureUrl;

            if (state.loggedInUserProfile) {
              state.loggedInUserProfile.profilePictureUrl =
                response.data.profilePictureUrl;
            }

            if (state.profileCache[user.username]) {
              state.profileCache[user.username].profile.profilePictureUrl =
                response.data.profilePictureUrl;
            }

            state.loggedInUserMemeList.forEach((meme) => {
              if (meme.userId === userId) {
                meme.profilePictureUrl = response.data.profilePictureUrl;
              }
            });
          }

          if (response.data.profileBannerUrl) {
            state.loggedInUserProfileBannerUrl = response.data.profileBannerUrl;

            if (state.loggedInUserProfile) {
              state.loggedInUserProfile.profileBannerUrl =
                response.data.profileBannerUrl;
            }

            if (state.profileCache[user.username]) {
              state.profileCache[user.username].profile.profileBannerUrl =
                response.data.profileBannerUrl;
            }
          }

          state.isLoading = false;
        });

      } catch (error: any) {
        console.error("Error updating user profile:", error);
        
        let errorMessage = "Failed to update profile";
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        throw new Error(errorMessage);
      }
    },

    handleFollowToggle: async (isFollowing: boolean) => {
      try {
        const user = getCurrentAuthUser();
        const targetUsername = get().viewedUserName;

        if (!user.userId || !targetUsername) {
          throw new Error("Missing user ID or target username");
        }

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        let targetUserId: string;
        const state = get();

        if (state.profileCache[targetUsername]) {
          targetUserId = state.profileCache[targetUsername].profile.userId;
        } else {
          const targetUserResponse = await api.get(`/users/${targetUsername}`);
          targetUserId = targetUserResponse.data.userId;
        }

        const { useWebSocketStore } = await import("../hooks/useWebSockets");
        const success = useWebSocketStore
          .getState()
          .sendFollowRequest(targetUserId, targetUsername, isFollowing);

        if (!success) {
          throw new Error("Failed to send WebSocket follow request");
        }
        set((state) => {
          state.isLoading = false;
        });
      } catch (error) {
        console.error("Error toggling follow:", error);
        set((state) => {
          state.error = "Failed to toggle follow";
          state.isLoading = false;
        });
      }
    },

    addFollower: (follower: Followers) => {
      const user = getCurrentAuthUser();

      set((state) => {
        const followerExists = state.loggedInUserFollowers.some(
          (f) => f.userId === follower.userId
        );

        if (!followerExists) {
          state.loggedInUserFollowersCount += 1;
          state.loggedInUserFollowers.push(follower);

          if (user.username && state.profileCache[user.username]) {
            state.profileCache[user.username].profile.followersCount += 1;
          }

          if (state.loggedInUserProfile) {
            state.loggedInUserProfile.followersCount += 1;
            state.loggedInUserProfile.followers.push(follower);
          }
        }
      });
    },

    removeFollower: (userId: string) => {
      const user = getCurrentAuthUser();

      set((state) => {
        const followerExists = state.loggedInUserFollowers.some(
          (f) => f.userId === userId
        );

        if (followerExists) {
          state.loggedInUserFollowersCount = Math.max(
            0,
            state.loggedInUserFollowersCount - 1
          );
          state.loggedInUserFollowers = state.loggedInUserFollowers.filter(
            (f) => f.userId !== userId
          );

          if (user.username && state.profileCache[user.username]) {
            state.profileCache[user.username].profile.followersCount = Math.max(
              0,
              state.profileCache[user.username].profile.followersCount - 1
            );
          }

          if (state.loggedInUserProfile) {
            state.loggedInUserProfile.followersCount = Math.max(
              0,
              state.loggedInUserProfile.followersCount - 1
            );
            state.loggedInUserProfile.followers =
              state.loggedInUserProfile.followers.filter(
                (f) => f.userId !== userId
              );
          }
        }
      });
    },

    updateFollowingState: (
      followingUserId: string,
      followingUsername: string,
      isFollowing: boolean,
      profilePictureUrl: string
    ) => {

      set((state) => {
        if (isFollowing) {
          const alreadyFollowing = state.loggedInUserFollowing.some(
            (f) => f.userId === followingUserId
          );

          if (!alreadyFollowing) {
            state.loggedInUserFollowingCount += 1;
            state.loggedInUserFollowing.push({
              userId: followingUserId,
              username: followingUsername,
              profilePictureUrl: profilePictureUrl,
              isFollow: true,
            });

            if (state.loggedInUserProfile) {
              state.loggedInUserProfile.followingCount =
                state.loggedInUserFollowingCount;
              state.loggedInUserProfile.following = state.loggedInUserFollowing;
            }

            const user = getCurrentAuthUser();
            if (user.username && state.profileCache[user.username]) {
              state.profileCache[user.username].profile.followingCount =
                state.loggedInUserFollowingCount;
            }
          }
        } else {
          state.loggedInUserFollowingCount = Math.max(
            0,
            state.loggedInUserFollowingCount - 1
          );
          state.loggedInUserFollowing = state.loggedInUserFollowing.filter(
            (following) => following.userId !== followingUserId
          );

          if (state.loggedInUserProfile) {
            state.loggedInUserProfile.followingCount =
              state.loggedInUserFollowingCount;
            state.loggedInUserProfile.following = state.loggedInUserFollowing;
          }

          const user = getCurrentAuthUser();
          if (user.username && state.profileCache[user.username]) {
            state.profileCache[user.username].profile.followingCount =
              state.loggedInUserFollowingCount;
          }
        }
      });
    },

    updateFollowerState: (
      followerId: string,
      followerUsername: string,
      isFollowing: boolean,
      profilePictureUrl: string
    ) => {
      set((state) => {
        if (isFollowing) {
          const alreadyFollower = state.loggedInUserFollowers.some(
            (f) => f.userId === followerId
          );

          if (!alreadyFollower) {
            state.loggedInUserFollowersCount += 1;
            state.loggedInUserFollowers.push({
              userId: followerId,
              username: followerUsername,
              profilePictureUrl: profilePictureUrl,
              isFollow: true,
            });

            if (state.loggedInUserProfile) {
              state.loggedInUserProfile.followersCount =
                state.loggedInUserFollowersCount;
              state.loggedInUserProfile.followers = state.loggedInUserFollowers;
            }

            const user = getCurrentAuthUser();
            if (user.username && state.profileCache[user.username]) {
              state.profileCache[user.username].profile.followersCount =
                state.loggedInUserFollowersCount;
            }
          }
        } else {
          state.loggedInUserFollowersCount = Math.max(
            0,
            state.loggedInUserFollowersCount - 1
          );
          state.loggedInUserFollowers = state.loggedInUserFollowers.filter(
            (follower) => follower.userId !== followerId
          );

          if (state.loggedInUserProfile) {
            state.loggedInUserProfile.followersCount =
              state.loggedInUserFollowersCount;
            state.loggedInUserProfile.followers = state.loggedInUserFollowers;
          }

          const user = getCurrentAuthUser();
          if (user.username && state.profileCache[user.username]) {
            state.profileCache[user.username].profile.followersCount =
              state.loggedInUserFollowersCount;
          }
        }
      });
    },

    updateViewedProfileFollowState: (isFollowing: boolean) => {
      set((state) => {
        state.isFollowingViewedUser = isFollowing;

        if (state.viewedUserProfile) {
          state.viewedUserProfile.followed = isFollowing;
        }

        if (state.viewedUserName && state.profileCache[state.viewedUserName]) {
          state.profileCache[state.viewedUserName].profile.followed =
            isFollowing;
        }
      });
    },

    updateViewedProfileCounts: () => {
      const state = get();
      const viewedUsername = state.viewedUserName;

      if (viewedUsername) {
        set((state) => {
          const isFollowing = state.isFollowingViewedUser;

          if (state.viewedUserProfile) {
            const newFollowersCount = isFollowing
              ? state.viewedUserFollowersCount + 1
              : Math.max(0, state.viewedUserFollowersCount - 1);

            state.viewedUserFollowersCount = newFollowersCount;

            state.viewedUserProfile.followersCount = newFollowersCount;

            if (state.profileCache[viewedUsername]) {
              state.profileCache[viewedUsername].profile.followersCount =
                newFollowersCount;
            }
          }
        });

        setTimeout(() => {
          api
            .get(`/profile/${viewedUsername}?includeMemes=false`)
            .then((response) => {
              set((state) => {
                state.viewedUserFollowersCount =
                  response.data.followersCount || 0;
                state.viewedUserFollowingCount =
                  response.data.followingCount || 0;

                if (state.viewedUserProfile) {
                  state.viewedUserProfile.followersCount =
                    response.data.followersCount || 0;
                  state.viewedUserProfile.followingCount =
                    response.data.followingCount || 0;
                }

                if (state.profileCache[viewedUsername]) {
                  state.profileCache[viewedUsername].profile.followersCount =
                    response.data.followersCount || 0;
                  state.profileCache[viewedUsername].profile.followingCount =
                    response.data.followingCount || 0;
                }
              });
            })
            .catch((error) => {
              console.error("Error updating viewed profile counts:", error);
            });
        }, 500);
      }
    },

    fetchFollowData: async (
      userId: string,
      type: "followers" | "following",
      offset: number,
      limit: number
    ) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const response = await api.get(
          `/profile/${userId}/${type}?offset=${offset}&limit=${limit}`
        );

        set((state) => {
          state.isLoading = false;
        });
        return response.data;
      } catch (error) {
        console.error(`Error fetching ${type} data for user ${userId}:`, error);
        set((state) => {
          state.error = `Failed to fetch ${type} data`;
          state.isLoading = false;
        });
        return {
          [type]: [],
          offset: 0,
          limit: limit,
          [`${type}Count`]: 0,
        };
      }
    },
  }))
);

export const useUserStore = createSelectors<UserState & UserActions>(
  useRawUserStore
);

export { setCurrentAuthUser };
