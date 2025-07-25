import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import api from "../hooks/api";
import type {
  Meme,
  Comment,
  ApiMeme,
  UserApi,
  ApiSearchResult,
} from "../types/mems";
// import type { UserApi, SearchResult } from "../types/search";
import { useWebSocketStore } from "../hooks/useWebSockets";
import { mapApiMemeToMeme } from "../utils/memeMappers";
import { getCurrentAuthUser } from "../utils/authHelpers";

// Track the current meme being viewed
let currentMemeId: string | null = null;

// Define the store interface
interface MemeContentState {
  // Meme collections
  memes: Meme[];
  recomendedMemes: Meme[];
  memeList: Meme[];
  likedMemes: Meme[];
  savedMemes: Meme[];
  selectedMeme: Meme | null;

  // Search results
  searchUsers: UserApi[];
  searchMemes: Meme[];

  // UI state
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  uploadProgress: number | null;
  searchQuery: string;

  // Pagination state
  currentPage: number;
  hasMoreMemes: boolean;

  // Cache state
  userDataLoaded: boolean;

  // Profile tabs cache
  profileTabsCache: {
    [userId: string]: {
      [tabType: string]: {
        memes: Meme[];
        hasMore: boolean;
        total: number;
        timestamp: number;
        offset: number;
      };
    };
  };

  // WebSocket related properties for meme sessions
  wsUnsubscribe: (() => void) | null;
}

interface MemeContentActions {
  // Fetch operations
  fetchMemes: () => Promise<void>;
  fetchMoreMemes: () => Promise<void>;
  fetchRecomendedMemes: (
    memeId: string,
    userId: string,
    page?: number,
    limit?: number
  ) => Promise<{
    memes: Meme[];
    hasMore: boolean;
    cursor: any;
    currentPage: number;
  } | void>;
  searchMemesAndUsers: (query: string) => Promise<void>;
  discoverMemes: (
    username?: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  fetchMoreDiscoverMemes: () => Promise<void>;
  fetchMemeById: (id: string) => Promise<Meme | null>;
  fetchMemeComments: (
    id: string,
    page: number,
    limit: number
  ) => Promise<{
    comments: Comment[];
    currentPage: number;
    totalItems: number;
    totalPages?: number;
  }>;
  fetchUserMemes: (
    userId: string,
    offset?: number,
    limit?: number,
    type?: string
  ) => Promise<{
    memes: Meme[];
    hasMore: boolean;
    total: number;
  }>;

  // Meme interactions
  toggleLike: (id: string, username: string) => Promise<void>;
  toggleSave: (id: string, username: string) => Promise<void>;
  addComment: (
    memeId: string,
    username: string,
    text: string,
    profilePictureUrl: string,
    userId: string
  ) => Promise<void>;
  deleteMeme: (id: string) => Promise<void>;

  // UI actions
  setSelectedMeme: (meme: Meme | null) => void;
  setSearchQuery: (query: string) => void;
  clearSearchResults: () => void;

  // WebSocket session management
  joinPostSession: (memeId: string) => void;
  leavePostSession: (memeId: string) => void;

  // State updates
  updateMemeStats: (
    memeId: string,
    stats: { likes?: number; saves?: number }
  ) => void;
  updateCommentInStore: (comment: Comment) => void;
  forceAddComment: (comment: Comment) => void;

  // Cache management
  clearProfileTabCache: (userId: string, tabType?: string) => void;

  // User data management
  resetUserData: () => void;
}

export type MemeContentStore = MemeContentState & MemeContentActions;

// Create the store with immer middleware for more efficient updates
const useRawMemeContentStore = create<MemeContentStore>()(
  immer((set) => ({
    // Initial state
    memes: [],
    recomendedMemes: [],
    memeList: [],
    likedMemes: [],
    savedMemes: [],
    selectedMeme: null,
    searchUsers: [],
    searchMemes: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    uploadProgress: null,
    searchQuery: "",
    currentPage: 1,
    hasMoreMemes: true,
    userDataLoaded: false,
    profileTabsCache: {},
    wsUnsubscribe: null,

    // Fetch operations
    fetchMemes: async () => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
          state.currentPage = 1; // Reset pagination when fetching initial memes
          state.hasMoreMemes = true;
        });
        const user = getCurrentAuthUser();

        let memes: Meme[] = [];
        let likedMemeIds: string[] = [];
        let savedMemeIds: string[] = [];

        if (user && user.userId) {
          // Fetch memes with the new response format
          const response = await api.get(`memes/feed/main`, {
            params: {
              userId: user.userId,
              page: 1,
              limit: 10,
            },
          });

          // The new response format has memes array and hasNextPage property
          if (
            response.data &&
            response.data.memes &&
            Array.isArray(response.data.memes)
          ) {
            // Process each meme item which now includes liked and saved status
            memes = response.data.memes.map((item: any) => {
              // Extract the meme data
              const apiMeme = item.meme;
              // Create the meme object with liked and saved status
              const meme = mapApiMemeToMeme(
                apiMeme,
                false,
                item.liked,
                item.saved
              );

              // Track liked and saved status for collections
              if (item.liked) {
                likedMemeIds.push(meme.id);
              }
              if (item.saved) {
                savedMemeIds.push(meme.id);
              }

              return meme;
            });

            // Check if there are potentially more memes to load
            set((state) => {
              state.hasMoreMemes = response.data.hasNextPage === true;
            });
          }
        } else {
          // For non-logged in users, fetch trending memes
          const response = await api.get(
            "/memes/trending?excludeComments=true"
          );
          if (response.data && Array.isArray(response.data)) {
            memes = response.data.map((apiMeme: ApiMeme) =>
              mapApiMemeToMeme(apiMeme, false)
            );
          }
        }

        // Update the store with the memes and their liked/saved status
        if (user && user.userId) {
          // Create liked and saved meme arrays based on the IDs we collected
          const likedMemes = memes.filter((meme) =>
            likedMemeIds.includes(meme.id)
          );
          const savedMemes = memes.filter((meme) =>
            savedMemeIds.includes(meme.id)
          );

          set((state) => {
            state.memes = memes;
            state.likedMemes = likedMemes;
            state.savedMemes = savedMemes;
            state.isLoading = false;
            state.userDataLoaded = true; 
          });
        } else {
          set((state) => {
            state.memes = memes;
            state.isLoading = false;
          });
        }
      } catch (error) {
        console.error("Error fetching memes:", error);
        set((state) => {
          state.error = "Failed to fetch memes";
          state.isLoading = false;
        });
      }
    },

    fetchMoreMemes: async () => {
      try {
        const state = useRawMemeContentStore.getState();
        const currentPage = state.currentPage;
        const isLoadingMore = state.isLoadingMore;
        const hasMoreMemes = state.hasMoreMemes;

        if (isLoadingMore || !hasMoreMemes) {
          return;
        }
        
        set((state) => {
          state.isLoadingMore = true;
          state.error = null;
        });

        const user = getCurrentAuthUser();

        if (!user || !user.username) {
          set((state) => {
            state.hasMoreMemes = false;
            state.isLoadingMore = false;
          });
          return;
        }

        const nextPage = currentPage + 1;
        if (!useRawMemeContentStore.getState().isLoadingMore) {
          return;
        }
        
        const response = await api.get(`memes/feed/main`, {
          params: {
            userId: user.userId,
            page: nextPage,
            limit: 10,
          },
        });

        // Process the new response format
        if (
          response.data &&
          response.data.memes &&
          Array.isArray(response.data.memes)
        ) {
          let newMemes: Meme[] = [];
          let likedMemeIds: string[] = [];
          let savedMemeIds: string[] = [];

          // Process each meme item which includes liked and saved status
          newMemes = response.data.memes.map((item: any) => {
            // Extract the meme data
            const apiMeme = item.meme;
            // Create the meme object with liked and saved status
            const meme = mapApiMemeToMeme(
              apiMeme,
              false,
              item.liked,
              item.saved
            );

            // Track liked and saved status for collections
            if (item.liked) {
              likedMemeIds.push(meme.id);
            }
            if (item.saved) {
              savedMemeIds.push(meme.id);
            }

            return meme;
          });

          // Update the store with the new memes and their liked/saved status
          set((state) => {
            // Add new memes to the existing array
            state.memes = [...state.memes, ...newMemes];

            // Update liked and saved memes
            const newLikedMemes = newMemes.filter((meme) =>
              likedMemeIds.includes(meme.id)
            );
            const newSavedMemes = newMemes.filter((meme) =>
              savedMemeIds.includes(meme.id)
            );

            state.likedMemes = [...state.likedMemes, ...newLikedMemes];
            state.savedMemes = [...state.savedMemes, ...newSavedMemes];

            state.currentPage = nextPage;
            state.hasMoreMemes = response.data.hasNextPage === true;
            state.isLoadingMore = false;
          });
        } else {
          set((state) => {
            state.hasMoreMemes = false;
            state.isLoadingMore = false;
          });
        }
      } catch (error) {
        console.error("Error loading more memes:", error);
        set((state) => {
          state.error = "Failed to load more memes";
          state.isLoadingMore = false;
        });
      }
    },

    fetchRecomendedMemes: async (
      memeId: string,
      userId: String,
      page: number = 1,
      limit: number = 10
    ) => {
      try {
        set((state) => {
          if (page === 1) {
            state.isLoading = true;
          }
          state.error = null;
        });

        const response = await api.get(
          `/memes/recomendedMemes/${memeId}/${userId}?page=${page}&limit=${limit}`
        );

        if (!response.data || !Array.isArray(response.data.memes)) {
          set((state) => {
            if (page === 1) {
              state.recomendedMemes = [];
            }
            state.isLoading = false;
          });
          return;
        }

        const recommendedMemes = response.data.memes.map((apiMeme: ApiMeme) =>
          mapApiMemeToMeme(apiMeme, false)
        );

        set((state) => {
          if (page === 1) {
            state.recomendedMemes = recommendedMemes;
          } else {
            const existingIds = new Set(
              state.recomendedMemes.map((meme) => meme.id)
            );
            const uniqueNewMemes = recommendedMemes.filter(
              (meme: { id: string }) => !existingIds.has(meme.id)
            );
            state.recomendedMemes = [
              ...state.recomendedMemes,
              ...uniqueNewMemes,
            ];
          }
          state.isLoading = false;
        });

        return {
          memes: recommendedMemes,
          hasMore: recommendedMemes.length === limit,
          cursor: response.data.cursor,
          currentPage: page,
        };
      } catch (error) {
        console.error(
          `Error fetching recommended memes for meme ${memeId}, page ${page}:`,
          error
        );
        set((state) => {
          state.error = `Failed to fetch recommended memes`;
          state.isLoading = false;
          // Don't clear the array if it's not the first page
          if (page === 1) {
            state.recomendedMemes = [];
          }
        });

        return {
          memes: [],
          hasMore: false,
          cursor: null,
          currentPage: page,
        };
      }
    },

    searchMemesAndUsers: async (query: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
          state.searchQuery = query;
        });

        // Add excludeComments=true parameter to optimize response time
        const response = await api.get(
          `/memes/search?query=${query}&excludeComments=true`
        );

        const searchResult: ApiSearchResult = response.data;

        // Map memes from API format
        const memes =
          searchResult.memes?.map((apiMeme: ApiMeme) =>
            mapApiMemeToMeme(apiMeme, false)
          ) || [];

        set((state) => {
          state.searchUsers = searchResult.users || [];
          state.searchMemes = memes;
          state.isLoading = false;
        });
      } catch (error) {
        console.error("Error searching memes and users:", error);
        set((state) => {
          state.error = "Failed to search memes and users";
          state.isLoading = false;
        });
      }
    },

    discoverMemes: async (
      username?: string,
      page: number = 1,
      limit: number = 15
    ) => {
      try {
        // Set loading state for initial load only
        set((state) => {
          if (page === 1) {
            state.isLoading = true;
            state.currentPage = 1;
          }
          state.error = null;
        });

        const user = getCurrentAuthUser();

        let memes: Meme[] = [];
        let likedMemeIds: string[] = [];
        let savedMemeIds: string[] = [];

        const usernameToUse = username || user?.username || "";

        const response = await api.get(`memes/discover`, {
          params: {
            username: usernameToUse,
            page,
            limit,
          },
        });
        if (
          response.data &&
          response.data.memes &&
          Array.isArray(response.data.memes)
        ) {
          memes = response.data.memes.map((item: any) => {
            const apiMeme = item.meme;
            const meme = mapApiMemeToMeme(
              apiMeme,
              false,
              item.liked,
              item.saved
            );
            if (item.liked) {
              likedMemeIds.push(meme.id);
            }
            if (item.saved) {
              savedMemeIds.push(meme.id);
            }
            return meme;
          });

          const likedMemes = memes.filter((meme) =>
            likedMemeIds.includes(meme.id)
          );
          const savedMemes = memes.filter((meme) =>
            savedMemeIds.includes(meme.id)
          );

          // Update state
          set((state) => {
            // Update pagination info
            state.hasMoreMemes = response.data.hasNextPage === true;
            state.currentPage = page;

            if (page === 1) {
              // Replace existing memes on initial load
              state.searchMemes = memes;
              state.likedMemes = likedMemes;
              state.savedMemes = savedMemes;
            } else {
              // Append memes for pagination
              state.searchMemes = [...state.searchMemes, ...memes];

              // Update liked and saved collections - avoid duplicates
              const newLikedMemes = likedMemes.filter(
                (meme) => !state.likedMemes.some((m) => m.id === meme.id)
              );
              const newSavedMemes = savedMemes.filter(
                (meme) => !state.savedMemes.some((m) => m.id === meme.id)
              );

              state.likedMemes = [...state.likedMemes, ...newLikedMemes];
              state.savedMemes = [...state.savedMemes, ...newSavedMemes];
            }
            state.isLoading = false;
            state.userDataLoaded = true;
          });
        }
        // Fallback for older API format (direct array)
        else if (Array.isArray(response.data)) {
          memes = response.data.map((apiMeme: ApiMeme) =>
            mapApiMemeToMeme(apiMeme, false)
          );

          // Update state
          set((state) => {
            // Assume there are more memes if we got a full page
            state.hasMoreMemes = memes.length >= limit;
            state.currentPage = page;

            if (page === 1) {
              state.searchMemes = memes;
            } else {
              state.searchMemes = [...state.searchMemes, ...memes];
            }

            state.isLoading = false;
          });
        } else {
          set((state) => {
            state.isLoading = false;
            state.error = "Unexpected response format";
          });
        }
      } catch (error) {
        console.error("Error discovering memes:", error);
        set((state) => {
          state.error = "Failed to discover memes";
          state.isLoading = false;
        });
      }
    },

    fetchMoreDiscoverMemes: async () => {
      try {
        const state = useRawMemeContentStore.getState();
        const currentPage = state.currentPage;
        const isLoadingMore = state.isLoadingMore;
        const hasMoreMemes = state.hasMoreMemes;

        if (isLoadingMore || !hasMoreMemes) {
          return;
        }

        set((state) => {
          state.isLoadingMore = true;
          state.error = null;
        });

        const user = getCurrentAuthUser();

        if (!user || !user.username) {
          set((state) => {
            state.hasMoreMemes = false;
            state.isLoadingMore = false;
          });
          return;
        }

        const nextPage = currentPage + 1;
        if (!useRawMemeContentStore.getState().isLoadingMore) {
          return;
        }
        
        const response = await api.get(`memes/discover`, {
          params: {
            username: user.username,
            page: nextPage,
            limit: 15,
          },
        });

        if (
          response.data &&
          response.data.memes &&
          Array.isArray(response.data.memes)
        ) {
          let newMemes: Meme[] = [];
          let likedMemeIds: string[] = [];
          let savedMemeIds: string[] = [];

          newMemes = response.data.memes.map((item: any) => {
            const apiMeme = item.meme;
            const meme = mapApiMemeToMeme(
              apiMeme,
              false,
              item.liked,
              item.saved
            );

            if (item.liked) {
              likedMemeIds.push(meme.id);
            }
            if (item.saved) {
              savedMemeIds.push(meme.id);
            }

            return meme;
          });

          set((state) => {
            state.searchMemes = [...state.searchMemes, ...newMemes];

            const newLikedMemes = newMemes.filter((meme) =>
              likedMemeIds.includes(meme.id)
            );
            const newSavedMemes = newMemes.filter((meme) =>
              savedMemeIds.includes(meme.id)
            );

            state.likedMemes = [...state.likedMemes, ...newLikedMemes];
            state.savedMemes = [...state.savedMemes, ...newSavedMemes];

            state.currentPage = nextPage;
            state.hasMoreMemes = response.data.hasNextPage === true;
            state.isLoadingMore = false;
          });
        } else {
          set((state) => {
            state.hasMoreMemes = false;
            state.isLoadingMore = false;
          });
        }
      } catch (error) {
        console.error("Error loading more discover memes:", error);
        set((state) => {
          state.error = "Failed to load more discover memes";
          state.isLoadingMore = false;
        });
      }
    },

    fetchMemeById: async (id: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        // Get the current user from auth store
        const user = getCurrentAuthUser();
        const userId = user?.userId || "";

        // For meme detail page, we want to include basic meme info but not comments
        // We'll fetch comments separately with pagination
        // Include userId in the request to get personalized like/save status
        const response = await api.get(
          `/memes/memepage/${id}?excludeComments=true${
            userId ? `&userId=${userId}` : ""
          }`
        );

        // Check if the response includes liked and saved status
        let liked = false;
        let saved = false;

        if (response.data && typeof response.data === "object") {
          // Check if the response has the new format with meme and status
          if (
            response.data.meme &&
            (response.data.liked !== undefined ||
              response.data.saved !== undefined)
          ) {
            liked = !!response.data.liked;
            saved = !!response.data.saved;

            const meme = mapApiMemeToMeme(
              response.data.meme,
              false,
              liked,
              saved
            );

            set((state) => {
              const isLikedInStore = state.likedMemes.some((m) => m.id === id);
              if (liked && !isLikedInStore) {
                state.likedMemes.push(meme);
              } else if (!liked && isLikedInStore) {
                state.likedMemes = state.likedMemes.filter((m) => m.id !== id);
              }

              const isSavedInStore = state.savedMemes.some((m) => m.id === id);
              if (saved && !isSavedInStore) {
                state.savedMemes.push(meme);
              } else if (!saved && isSavedInStore) {
                state.savedMemes = state.savedMemes.filter((m) => m.id !== id);
              }
              state.selectedMeme = meme;
              state.isLoading = false;
            });

            return meme;
          } else {
            const meme = mapApiMemeToMeme(response.data, false);

            try {
              const { useUserStore } = await import("../store/useUserStore");
              const userState = useUserStore.getState();

              if (userState.loggedInUserProfile) {
                const userLikedMemes = userState.likedMemes;
                const userSavedMemes = userState.savedMemes;

                const isLikedInUserProfile = userLikedMemes.some(
                  (m) => m.id === id
                );
                const isSavedInUserProfile = userSavedMemes.some(
                  (m) => m.id === id
                );
                meme.liked = isLikedInUserProfile;
                meme.saved = isSavedInUserProfile;

                set((state) => {
                  const isLikedInStore = state.likedMemes.some(
                    (m) => m.id === id
                  );
                  if (isLikedInUserProfile && !isLikedInStore) {
                    state.likedMemes.push(meme);
                  } else if (!isLikedInUserProfile && isLikedInStore) {
                    state.likedMemes = state.likedMemes.filter(
                      (m) => m.id !== id
                    );
                  }

                  const isSavedInStore = state.savedMemes.some(
                    (m) => m.id === id
                  );
                  if (isSavedInUserProfile && !isSavedInStore) {
                    state.savedMemes.push(meme);
                  } else if (!isSavedInUserProfile && isSavedInStore) {
                    state.savedMemes = state.savedMemes.filter(
                      (m) => m.id !== id
                    );
                  }
                });
              }
            } catch (error) {
              console.error(
                "Error checking liked/saved status from user profile:",
                error
              );
            }

            set((state) => {
              state.selectedMeme = meme;
              state.isLoading = false;
            });

            return meme;
          }
        } else {
          console.error("Unexpected API response format:", response.data);
          const meme = mapApiMemeToMeme(response.data, false);

          set((state) => {
            state.selectedMeme = meme;
            state.isLoading = false;
          });

          return meme;
        }
      } catch (error) {
        console.error(`Error fetching meme with ID ${id}:`, error);
        set((state) => {
          state.error = `Failed to fetch meme with ID ${id}`;
          state.isLoading = false;
        });
        return null;
      }
    },

    fetchMemeComments: async (id: string, page: number, limit: number) => {
      try {
        const response = await api.get(
          `/memes/${id}/comments?page=${page}&limit=${limit}`
        );
        return {
          comments: response.data.data,
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalItems,
        };
      } catch (error) {
        console.error(`Error fetching comments for meme ${id}:`, error);
        return {
          comments: [],
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
        };
      }
    },

    fetchUserMemes: async (
      userId: string,
      offset?: number,
      limit?: number,
      type?: string
    ): Promise<{
      memes: Meme[];
      hasMore: boolean;
      total: number;
    }> => {
      const actualOffset = offset ?? 0;
      const actualLimit = limit ?? 10;
      const actualType = type ?? "UPLOAD";
      try {
        let apiCallNeeded = true;

        const cachedResult = await new Promise((resolve) => {
          set((state) => {
            if (actualOffset === 0) {
              state.isLoading = true;
              state.error = null;
            }

            if (
              state.profileTabsCache[userId] &&
              state.profileTabsCache[userId][actualType]
            ) {
              const cache = state.profileTabsCache[userId][actualType];
              const cacheAge = Date.now() - cache.timestamp;

              if (cacheAge < 300000) {
                if (actualOffset <= cache.offset) {
                  const cachedMemes = JSON.parse(
                    JSON.stringify(
                      cache.memes.slice(0, actualOffset + actualLimit)
                    )
                  );

                  if (actualType === "UPLOAD") {
                    if (actualOffset === 0) {
                      state.memeList = cachedMemes;
                    }
                  } else if (actualType === "LIKE") {
                    if (actualOffset === 0) {
                      state.likedMemes = cachedMemes;
                    }
                  } else if (actualType === "SAVE") {
                    if (actualOffset === 0) {
                      state.savedMemes = cachedMemes;
                    }
                  }

                  state.isLoading = false;
                  apiCallNeeded = false;

                  resolve({
                    memes: cachedMemes,
                    hasMore: cache.hasMore,
                    total: cache.total,
                  });
                  return;
                }
              }
            }
            resolve(null);
          });
        });

        if (!apiCallNeeded && cachedResult) {
          return cachedResult as {
            memes: Meme[];
            hasMore: boolean;
            total: number;
          };
        } else if (!apiCallNeeded && !cachedResult) {
          return { memes: [], hasMore: false, total: 0 };
        }

        const response = await api.get(`/profile/user-memes/${userId}/`, {
          params: {
            offset: actualOffset,
            limit: actualLimit,
            type: actualType,
          },
        });

        if (!response.data || !Array.isArray(response.data.memes)) {
          console.error("Unexpected API response format:", response.data);
          set((state) => {
            if (actualOffset === 0) {
              if (actualType === "UPLOAD") {
                state.memeList = [];
              } else if (actualType === "LIKE") {
                state.likedMemes = [];
              } else if (actualType === "SAVE") {
                state.savedMemes = [];
              }
            }
            state.isLoading = false;
          });
          return {
            memes: [],
            hasMore: false,
            total: 0,
          };
        }

        const memes = response.data.memes.map((item: any) => {
          if (item.meme) {
            return mapApiMemeToMeme(item.meme, false, item.liked, item.saved);
          } else {
            return mapApiMemeToMeme(item, false);
          }
        });

        const total = response.data.total || 0;
        const hasMore =
          response.data.hasNextPage !== undefined
            ? response.data.hasNextPage
            : actualOffset + memes.length < total;

        const memesCopy = JSON.parse(JSON.stringify(memes));

        await new Promise<void>((resolve) => {
          set((state) => {
            try {
              if (actualType === "UPLOAD") {
                if (actualOffset === 0) {
                  state.memeList = memesCopy;
                } else {
                  const existingIds = new Set(state.memeList.map((m) => m.id));
                  const uniqueNewMemes = memesCopy.filter(
                    (m: { id: string }) => !existingIds.has(m.id)
                  );
                  state.memeList = [...state.memeList, ...uniqueNewMemes];
                }
              } else if (actualType === "LIKE") {
                if (actualOffset === 0) {
                  state.likedMemes = memesCopy;
                } else {
                  const existingIds = new Set(
                    state.likedMemes.map((m) => m.id)
                  );
                  const uniqueNewMemes = memesCopy.filter(
                    (m: { id: string }) => !existingIds.has(m.id)
                  );
                  state.likedMemes = [...state.likedMemes, ...uniqueNewMemes];
                }
              } else if (actualType === "SAVE") {
                if (actualOffset === 0) {
                  state.savedMemes = memesCopy;
                } else {
                  const existingIds = new Set(
                    state.savedMemes.map((m) => m.id)
                  );
                  const uniqueNewMemes = memesCopy.filter(
                    (m: { id: string }) => !existingIds.has(m.id)
                  );
                  state.savedMemes = [...state.savedMemes, ...uniqueNewMemes];
                }
              }

              if (!state.profileTabsCache[userId]) {
                state.profileTabsCache[userId] = {};
              }
              if (
                state.profileTabsCache[userId][actualType] &&
                actualOffset > 0
              ) {
                const existingCache =
                  state.profileTabsCache[userId][actualType];
                const existingMemesCopy = JSON.parse(
                  JSON.stringify(existingCache.memes)
                );
                const existingIds = new Set(
                  existingMemesCopy.map((m: { id: any }) => m.id)
                );
                const uniqueNewMemes = memesCopy.filter(
                  (m: { id: unknown }) => !existingIds.has(m.id)
                );

                state.profileTabsCache[userId][actualType] = {
                  memes: [...existingMemesCopy, ...uniqueNewMemes],
                  hasMore,
                  total,
                  timestamp: Date.now(),
                  offset: Math.max(
                    existingCache.offset,
                    actualOffset + memes.length
                  ),
                };
              } else {
                state.profileTabsCache[userId][actualType] = {
                  memes: memesCopy,
                  hasMore,
                  total,
                  timestamp: Date.now(),
                  offset: actualOffset + memes.length,
                };
              }

              state.isLoading = false;
            } catch (err) {
              console.error("Error updating state:", err);
              state.isLoading = false;
              state.error = "Error updating meme data";
            }
            resolve();
          });
        });

        return {
          memes,
          hasMore,
          total,
        };
      } catch (error) {
        console.error(
          `Error fetching memes for user ${userId}, type ${actualType}:`,
          error
        );
        set((state) => {
          state.error = `Failed to fetch memes for user`;
          state.isLoading = false;
        });

        return {
          memes: [],
          hasMore: false,
          total: 0,
        };
      }
    },

    toggleLike: async (id: string, username?: string) => {
      try {
        if (username) {
          set((state) => {
            const isCurrentlyLiked = state.likedMemes.some(
              (m: Meme) => m.id === id
            );
            const newLikeState = !isCurrentlyLiked;

            const meme =
              (state.selectedMeme?.id === id ? state.selectedMeme : undefined) ||
              state.memes.find((m: Meme) => m.id === id) ||
              state.memeList.find((m: Meme) => m.id === id) ||
              state.likedMemes.find((m: Meme) => m.id === id) ||
              state.savedMemes.find((m: Meme) => m.id === id) ||
              state.searchMemes.find((m: Meme) => m.id === id);

            if (!meme) {
              return;
            }

            const newLikeCount = newLikeState
              ? meme.likeCount + 1
              : Math.max(0, meme.likeCount - 1);

            if (newLikeState) {
              if (!state.likedMemes.some((m: Meme) => m.id === id)) {
                state.likedMemes.push({ 
                  ...meme, 
                  likeCount: newLikeCount,
                  liked: true 
                });
              }
            } else {
              state.likedMemes = state.likedMemes.filter((m) => m.id !== id);
            }

            const updateMemeInArray = (memes: Meme[]): Meme[] =>
              memes.map((m: Meme) =>
                m.id === id ? { ...m, likeCount: newLikeCount, liked: newLikeState } : m
              );

            state.memes = updateMemeInArray(state.memes);
            state.memeList = updateMemeInArray(state.memeList);
            state.savedMemes = updateMemeInArray(state.savedMemes);
            state.searchMemes = updateMemeInArray(state.searchMemes);

            if (state.selectedMeme?.id === id) {
              state.selectedMeme = {
                ...state.selectedMeme,
                likeCount: newLikeCount,
                liked: newLikeState,
              };
            }
          });

          return;
        }

        const { useWebSocketStore } = await import("../hooks/useWebSockets");

        set((state) => {
          state.likedMemes.some(
            (m: Meme) => m.id === id
          );
        });

        const success = await useWebSocketStore.getState().sendLikeRequest(id);

        if (!success) {
          console.error("WebSocket like request failed");
          set((state) => {
            state.error = `Failed to toggle like for meme ${id}`;
          });
        }
      } catch (error) {
        console.error(`Error toggling like for meme ${id}:`, error);
        set((state) => {
          state.error = `Failed to toggle like for meme ${id}`;
        });
      }
    },

    toggleSave: async (id: string, username?: string) => {
      try {
        if (username) {
          set((state) => {
            const isCurrentlySaved = state.savedMemes.some(
              (m: Meme) => m.id === id
            );
            const meme =
              (state.selectedMeme && state.selectedMeme.id === id
                ? state.selectedMeme
                : undefined) ||
              state.memes.find((m: Meme) => m.id === id) ||
              state.memeList.find((m: Meme) => m.id === id) ||
              state.likedMemes.find((m: Meme) => m.id === id) ||
              state.savedMemes.find((m: Meme) => m.id === id) ||
              state.searchMemes.find((m: Meme) => m.id === id);

            if (!meme) {
              console.error(`Cannot find meme with ID ${id} in any collection`);
              return;
            }

            const newSaveState = !isCurrentlySaved;

            const newSaveCount = newSaveState
              ? meme.saveCount + 1
              : Math.max(0, meme.saveCount - 1);

            if (newSaveState) {
              if (!state.savedMemes.some((m: Meme) => m.id === id)) {
                state.savedMemes.push({ 
                  ...meme, 
                  saveCount: newSaveCount,
                  saved: true 
                });
              }
            } else {
              state.savedMemes = state.savedMemes.filter(
                (m: Meme) => m.id !== id
              );
            }

            const updateMemeInArray = (memes: Meme[]): Meme[] =>
              memes.map((m: Meme) =>
                m.id === id ? { ...m, saveCount: newSaveCount } : m
              );

            state.memes = updateMemeInArray(state.memes);
            state.memeList = updateMemeInArray(state.memeList);
            state.likedMemes = updateMemeInArray(state.likedMemes);
            state.savedMemes = updateMemeInArray(state.savedMemes);
            state.searchMemes = updateMemeInArray(state.searchMemes);

            const user = getCurrentAuthUser();
            if (user && user.userId) {
              const userId = user.userId;
              if (state.profileTabsCache[userId]) {
                try {
                  Object.keys(state.profileTabsCache[userId]).forEach(
                    (tabType) => {
                      if (state.profileTabsCache[userId][tabType]?.memes) {
                        const memesCopy = JSON.parse(
                          JSON.stringify(
                            state.profileTabsCache[userId][tabType].memes
                          )
                        );

                        const updatedMemes = memesCopy.map(
                          (m: { id: string }) =>
                            m.id === id
                              ? {
                                  ...m,
                                  saveCount: newSaveCount,
                                  saved: newSaveState,
                                }
                              : m
                        );

                        state.profileTabsCache[userId][tabType].memes =
                          updatedMemes;
                      }
                    }
                  );

                  if (
                    !newSaveState &&
                    state.profileTabsCache[userId]["SAVE"]
                  ) {
                    const memesCopy = JSON.parse(
                      JSON.stringify(
                        state.profileTabsCache[userId]["SAVE"].memes
                      )
                    );

                    state.profileTabsCache[userId]["SAVE"].memes =
                      memesCopy.filter((m: { id: string }) => m.id !== id);
                  }
                } catch (err) {
                  console.error("Error updating profile cache:", err);
                }
              }
            }

            if (state.selectedMeme && state.selectedMeme.id === id) {
              state.selectedMeme = {
                ...state.selectedMeme,
                saveCount: newSaveCount,
                saved: newSaveState,
              };
            }
          });
          return;
        }

        const { useWebSocketStore } = await import("../hooks/useWebSockets");

        let meme = null;

        set((state) => {
          meme =
            (state.selectedMeme && state.selectedMeme.id === id
              ? state.selectedMeme
              : undefined) ||
            state.memes.find((m: Meme) => m.id === id) ||
            state.memeList.find((m: Meme) => m.id === id) ||
            state.likedMemes.find((m: Meme) => m.id === id) ||
            state.savedMemes.find((m: Meme) => m.id === id) ||
            state.searchMemes.find((m: Meme) => m.id === id);

          if (!meme) {
            console.error(`Cannot find meme with ID ${id} in any collection`);
          }
        });

        const success = await useWebSocketStore.getState().sendSaveRequest(id);

        if (!success) {
          console.error("Failed to send save request via WebSocket");
          set((state) => {
            state.error = `Failed to toggle save for meme ${id}`;
          });
        }
      } catch (error) {
        console.error(`Error toggling save for meme ${id}:`, error);
        set((state) => {
          state.error = `Failed to toggle save for meme ${id}`;
        });
      }
    },

    addComment: async (
      memeId: string,
      username: string,
      text: string,
      profilePictureUrl: string,
      userId: string
    ) => {
      try {
        const response = await api.post(`/memes/${memeId}/comment`, {
          username,
          text,
          profilePictureUrl,
          userId,
        });

        const newComment: Comment = {
          id: response.data.id,
          memeId,
          userId,
          text,
          username,
          createdAt: new Date().toISOString(),
          profilePictureUrl,
        };

        const store = useRawMemeContentStore.getState();
        store.forceAddComment(newComment);
      } catch (error) {
        console.error(`Error adding comment to meme ${memeId}:`, error);
        set((state) => {
          state.error = `Failed to add comment to meme ${memeId}`;
        });
      }
    },

    deleteMeme: async (id: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        await api.delete(`/memes/${id}`);

        set((state) => {
          state.memes = state.memes.filter((meme: Meme) => meme.id !== id);
          state.memeList = state.memeList.filter(
            (meme: Meme) => meme.id !== id
          );
          state.likedMemes = state.likedMemes.filter(
            (meme: Meme) => meme.id !== id
          );
          state.savedMemes = state.savedMemes.filter(
            (meme: Meme) => meme.id !== id
          );
          state.searchMemes = state.searchMemes.filter(
            (meme: Meme) => meme.id !== id
          );

          if (state.selectedMeme && state.selectedMeme.id === id) {
            state.selectedMeme = null;
          }

          state.isLoading = false;
        });
      } catch (error) {
        console.error(`Error deleting meme ${id}:`, error);
        set((state) => {
          state.error = `Failed to delete meme ${id}`;
          state.isLoading = false;
        });
      }
    },

    // UI actions
    setSelectedMeme: (meme: Meme | null) => {
      set((state) => {
        state.selectedMeme = meme;
      });
    },

    setSearchQuery: (query: string) => {
      set((state) => {
        state.searchQuery = query;
      });
    },

    clearSearchResults: () => {
      set((state) => {
        state.searchUsers = [];
        state.searchMemes = [];
        state.searchQuery = "";
      });
    },

    joinPostSession: (memeId: string) => {
      if (currentMemeId === memeId) {
        return;
      }

      currentMemeId = memeId;

      const wsState = useWebSocketStore.getState();

      if (
        wsState.isConnected &&
        wsState.client &&
        wsState.client.readyState === WebSocket.OPEN
      ) {
        wsState.sendJoinPostRequest(memeId);
      } else {
        wsState.restoreConnection();
        setTimeout(() => {
          if (currentMemeId === memeId) {
            useWebSocketStore.getState().sendJoinPostRequest(memeId);
          }
        }, 1000);
      }
    },

    leavePostSession: (memeId: string) => {
      if (currentMemeId !== memeId) {
        return;
      }

      currentMemeId = null;

      const wsState = useWebSocketStore.getState();

      if (
        wsState.isConnected &&
        wsState.client &&
        wsState.client.readyState === WebSocket.OPEN
      ) {
        wsState.sendLeavePostRequest(memeId);
      }
    },

    // State updates
    updateMemeStats: (
      memeId: string,
      stats: { likes?: number; saves?: number }
    ) => {
      set((state) => {
        const updateMemeInArray = (memes: Meme[]): Meme[] =>
          memes.map((meme: Meme) =>
            meme.id === memeId
              ? {
                  ...meme,
                  likeCount:
                    stats.likes !== undefined ? stats.likes : meme.likeCount,
                  saveCount:
                    stats.saves !== undefined ? stats.saves : meme.saveCount,
                }
              : meme
          );

        state.memes = updateMemeInArray(state.memes);
        state.memeList = updateMemeInArray(state.memeList);
        state.likedMemes = updateMemeInArray(state.likedMemes);
        state.savedMemes = updateMemeInArray(state.savedMemes);
        state.searchMemes = updateMemeInArray(state.searchMemes);

        if (state.selectedMeme && state.selectedMeme.id === memeId) {
          state.selectedMeme = {
            ...state.selectedMeme,
            likeCount:
              stats.likes !== undefined
                ? stats.likes
                : state.selectedMeme.likeCount,
            saveCount:
              stats.saves !== undefined
                ? stats.saves
                : state.selectedMeme.saveCount,
          };
        }
      });
    },

    updateCommentInStore: (comment: Comment) => {
      if (!comment.id) {
        comment.id = `temp-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;
      }

      let isDuplicate = false;

      set((state) => {
        if (state.selectedMeme && state.selectedMeme.id === comment.memeId) {
          isDuplicate = (state.selectedMeme.comments || []).some(
            (existingComment) => existingComment.id === comment.id
          );

          if (isDuplicate) {
            return; 
          }
        }

        const updateMemeInArray = (memes: Meme[]): Meme[] =>
          memes.map((meme: Meme) => {
            if (meme.id === comment.memeId) {
              const commentExists = (meme.comments || []).some(
                (existingComment) => existingComment.id === comment.id
              );

              if (commentExists) {
                return meme;
              }
              const updatedComments = [...(meme.comments || []), comment];

              updatedComments.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );

              return {
                ...meme,
                comments: updatedComments,
              };
            }
            return meme;
          });

        state.memes = updateMemeInArray(state.memes);
        state.memeList = updateMemeInArray(state.memeList);
        state.likedMemes = updateMemeInArray(state.likedMemes);
        state.savedMemes = updateMemeInArray(state.savedMemes);
        state.searchMemes = updateMemeInArray(state.searchMemes);

        if (
          state.selectedMeme &&
          state.selectedMeme.id === comment.memeId &&
          !isDuplicate
        ) {
          const updatedComments = [
            ...(state.selectedMeme.comments || []),
            comment,
          ];

          updatedComments.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          state.selectedMeme = {
            ...state.selectedMeme,
            comments: updatedComments,
          };
        }
      });

      return !isDuplicate;
    },

    forceAddComment: (comment: Comment) => {
      if (!comment.id) {
        comment.id = `temp-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;
      }

      set((state) => {
        if (!comment || !comment.memeId) {
          return;
        }

        const updateMemeInArray = (memes: Meme[]): Meme[] =>
          memes.map((meme: Meme) => {
            if (meme.id === comment.memeId) {
              const commentExists = (meme.comments || []).some(
                (existingComment) => existingComment.id === comment.id
              );

              if (commentExists) {
                return meme;
              }

              const updatedComments = [...(meme.comments || []), comment];

              updatedComments.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );

              return {
                ...meme,
                comments: updatedComments,
                commentCount: updatedComments.length,
              };
            }
            return meme;
          });

        state.memes = updateMemeInArray(state.memes);
        state.memeList = updateMemeInArray(state.memeList);
        state.likedMemes = updateMemeInArray(state.likedMemes);
        state.savedMemes = updateMemeInArray(state.savedMemes);
        state.searchMemes = updateMemeInArray(state.searchMemes);

        if (state.selectedMeme && state.selectedMeme.id === comment.memeId) {
          const commentExists = (state.selectedMeme.comments || []).some(
            (existingComment) => existingComment.id === comment.id
          );

          if (!commentExists) {
            const updatedComments = [
              ...(state.selectedMeme.comments || []),
              comment,
            ];

            updatedComments.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );

            state.selectedMeme = {
              ...state.selectedMeme,
              comments: updatedComments,
            };
          }
        }
      });
    },

    // Cache management
    clearProfileTabCache: (userId: string, tabType?: string) => {
      set((state) => {
        if (state.profileTabsCache[userId]) {
          if (tabType) {
            if (state.profileTabsCache[userId][tabType]) {
              delete state.profileTabsCache[userId][tabType];
            }
          } else {
            delete state.profileTabsCache[userId];
          }
        }
      });
    },

    resetUserData: () => {
      set((state) => {
        state.memeList = [];
        state.likedMemes = [];
        state.savedMemes = [];
        state.userDataLoaded = false;

        const user = getCurrentAuthUser();
        if (user && user.userId) {
          const userId = user.userId;
          if (state.profileTabsCache[userId]) {
            delete state.profileTabsCache[userId];
          }
        }
      });
    },
  }))
);

export const useMemeContentStore = createSelectors<
  MemeContentState,
  MemeContentActions
>(useRawMemeContentStore);
