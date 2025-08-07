import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import type { Meme, UserApi } from "../types/mems";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface MainPageCacheData {
  memes: Meme[];
  likedMemes: Meme[];
  savedMemes: Meme[];
  currentPage: number;
  hasMoreMemes: boolean;
  allPages: {
    [pageNumber: number]: {
      memes: Meme[];
      likedMemes: Meme[];
      savedMemes: Meme[];
    };
  };
}

interface ExplorePageCacheData {
  searchMemes: Meme[];
  likedMemes: Meme[];
  savedMemes: Meme[];
  currentPage: number;
  hasMoreMemes: boolean;
  allPages: {
    [pageNumber: number]: {
      searchMemes: Meme[];
      likedMemes: Meme[];
      savedMemes: Meme[];
    };
  };
}

interface SearchCacheData {
  searchMemes: Meme[];
  searchUsers: UserApi[];
  query: string;
}



interface CacheState {
  mainPageCache: CacheEntry<MainPageCacheData> | null;
  explorePageCache: CacheEntry<ExplorePageCacheData> | null;
  searchCache: Map<string, CacheEntry<SearchCacheData>>;
}

interface CacheActions {
  // Main page cache
  setMainPageCache: (data: MainPageCacheData) => void;
  getMainPageCache: () => MainPageCacheData | null;
  clearMainPageCache: () => void;
  updateMainPageCache: (pageNumber: number, pageData: {
    memes: Meme[];
    likedMemes: Meme[];
    savedMemes: Meme[];
  }, currentPage: number, hasMoreMemes: boolean) => void;
  addMemeToMainPageCache: (meme: Meme) => void;
  updateMemeInMainPageCache: (memeId: string, updates: Partial<Meme>) => void;
  
  // Explore page cache
  setExplorePageCache: (data: ExplorePageCacheData) => void;
  getExplorePageCache: () => ExplorePageCacheData | null;
  clearExplorePageCache: () => void;
  updateExplorePageCache: (pageNumber: number, pageData: {
    searchMemes: Meme[];
    likedMemes: Meme[];
    savedMemes: Meme[];
  }, currentPage: number, hasMoreMemes: boolean) => void;
  addMemeToExplorePageCache: (meme: Meme) => void;
  updateMemeInExplorePageCache: (memeId: string, updates: Partial<Meme>) => void;
  
  // Search cache
  setSearchCache: (query: string, data: SearchCacheData) => void;
  getSearchCache: (query: string) => SearchCacheData | null;
  clearSearchCache: (query?: string) => void;
  
  // Utility methods
  clearAllCache: () => void;
  isExpired: (timestamp: number) => boolean;
}

export type CacheStore = CacheState & CacheActions;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const useRawCacheStore = create<CacheStore>()(
  immer((set, get) => ({
    mainPageCache: null,
    explorePageCache: null,
    searchCache: new Map(),

    setMainPageCache: (data: MainPageCacheData) => {
      const now = Date.now();
      set((state) => {
        // Ensure allPages is initialized if not provided
        if (!data.allPages) {
          data.allPages = {
            1: {
              memes: data.memes,
              likedMemes: data.likedMemes,
              savedMemes: data.savedMemes,
            }
          };
        }
        
        state.mainPageCache = {
          data,
          timestamp: now,
          expiresAt: now + CACHE_DURATION,
        };
      });
    },

    getMainPageCache: () => {
      const cache = get().mainPageCache;
      if (!cache) return null;
      
      const now = Date.now();
      if (now > cache.expiresAt) {
        // Cache expired, clear it
        set((state) => {
          state.mainPageCache = null;
        });
        return null;
      }
      
      return cache.data;
    },

    clearMainPageCache: () => {
      set((state) => {
        state.mainPageCache = null;
      });
    },

    updateMainPageCache: (pageNumber: number, pageData: {
      memes: Meme[];
      likedMemes: Meme[];
      savedMemes: Meme[];
    }, currentPage: number, hasMoreMemes: boolean) => {
      const now = Date.now();
      set((state) => {
        if (!state.mainPageCache) {
          // If no cache exists, create a new one
          const allMemes = pageData.memes;
          const allLikedMemes = pageData.likedMemes;
          const allSavedMemes = pageData.savedMemes;
          
          state.mainPageCache = {
            data: {
              memes: allMemes,
              likedMemes: allLikedMemes,
              savedMemes: allSavedMemes,
              currentPage,
              hasMoreMemes,
              allPages: {
                [pageNumber]: pageData
              }
            },
            timestamp: now,
            expiresAt: now + CACHE_DURATION,
          };
        } else {
          // Update existing cache
          const cache = state.mainPageCache;
          
          // Add the new page data
          cache.data.allPages[pageNumber] = pageData;
          
          // Rebuild the combined arrays from all pages
          const allMemes: Meme[] = [];
          const allLikedMemes: Meme[] = [];
          const allSavedMemes: Meme[] = [];
          
          // Sort pages by page number and combine
          const sortedPages = Object.keys(cache.data.allPages)
            .map(Number)
            .sort((a, b) => a - b);
            
          for (const page of sortedPages) {
            const pageData = cache.data.allPages[page];
            allMemes.push(...pageData.memes);
            allLikedMemes.push(...pageData.likedMemes);
            allSavedMemes.push(...pageData.savedMemes);
          }
          
          // Update the main arrays and metadata
          cache.data.memes = allMemes;
          cache.data.likedMemes = allLikedMemes;
          cache.data.savedMemes = allSavedMemes;
          cache.data.currentPage = currentPage;
          cache.data.hasMoreMemes = hasMoreMemes;
          cache.timestamp = now;
          cache.expiresAt = now + CACHE_DURATION;
        }
      });
    },

    setExplorePageCache: (data: ExplorePageCacheData) => {
      const now = Date.now();
      set((state) => {
        // Ensure allPages is initialized if not provided
        if (!data.allPages) {
          data.allPages = {
            1: {
              searchMemes: data.searchMemes,
              likedMemes: data.likedMemes,
              savedMemes: data.savedMemes,
            }
          };
        }
        
        state.explorePageCache = {
          data,
          timestamp: now,
          expiresAt: now + CACHE_DURATION,
        };
      });
    },

    getExplorePageCache: () => {
      const cache = get().explorePageCache;
      if (!cache) return null;
      
      const now = Date.now();
      if (now > cache.expiresAt) {
        // Cache expired, clear it
        set((state) => {
          state.explorePageCache = null;
        });
        return null;
      }
      
      return cache.data;
    },

    clearExplorePageCache: () => {
      set((state) => {
        state.explorePageCache = null;
      });
    },

    updateExplorePageCache: (pageNumber: number, pageData: {
      searchMemes: Meme[];
      likedMemes: Meme[];
      savedMemes: Meme[];
    }, currentPage: number, hasMoreMemes: boolean) => {
      const now = Date.now();
      set((state) => {
        if (!state.explorePageCache) {
          // If no cache exists, create a new one
          const allSearchMemes = pageData.searchMemes;
          const allLikedMemes = pageData.likedMemes;
          const allSavedMemes = pageData.savedMemes;
          
          state.explorePageCache = {
            data: {
              searchMemes: allSearchMemes,
              likedMemes: allLikedMemes,
              savedMemes: allSavedMemes,
              currentPage,
              hasMoreMemes,
              allPages: {
                [pageNumber]: pageData
              }
            },
            timestamp: now,
            expiresAt: now + CACHE_DURATION,
          };
        } else {
          // Update existing cache
          const cache = state.explorePageCache;
          
          // Add the new page data
          cache.data.allPages[pageNumber] = pageData;
          
          // Rebuild the combined arrays from all pages
          const allSearchMemes: Meme[] = [];
          const allLikedMemes: Meme[] = [];
          const allSavedMemes: Meme[] = [];
          
          // Sort pages by page number and combine
          const sortedPages = Object.keys(cache.data.allPages)
            .map(Number)
            .sort((a, b) => a - b);
            
          for (const page of sortedPages) {
            const pageData = cache.data.allPages[page];
            allSearchMemes.push(...pageData.searchMemes);
            allLikedMemes.push(...pageData.likedMemes);
            allSavedMemes.push(...pageData.savedMemes);
          }
          
          // Update the main arrays and metadata
          cache.data.searchMemes = allSearchMemes;
          cache.data.likedMemes = allLikedMemes;
          cache.data.savedMemes = allSavedMemes;
          cache.data.currentPage = currentPage;
          cache.data.hasMoreMemes = hasMoreMemes;
          cache.timestamp = now;
          cache.expiresAt = now + CACHE_DURATION;
        }
      });
    },

    setSearchCache: (query: string, data: SearchCacheData) => {
      const now = Date.now();
      set((state) => {
        state.searchCache.set(query.toLowerCase().trim(), {
          data,
          timestamp: now,
          expiresAt: now + CACHE_DURATION,
        });
      });
    },

    getSearchCache: (query: string) => {
      const cache = get().searchCache.get(query.toLowerCase().trim());
      if (!cache) return null;
      
      const now = Date.now();
      if (now > cache.expiresAt) {
        // Cache expired, remove it
        set((state) => {
          state.searchCache.delete(query.toLowerCase().trim());
        });
        return null;
      }
      
      return cache.data;
    },

    clearSearchCache: (query?: string) => {
      set((state) => {
        if (query) {
          state.searchCache.delete(query.toLowerCase().trim());
        } else {
          state.searchCache.clear();
        }
      });
    },



    addMemeToMainPageCache: (meme: Meme) => {
      const now = Date.now();
      set((state) => {
        const cache = state.mainPageCache;
        if (cache && !get().isExpired(cache.timestamp)) {
          // Add to beginning of the main memes list (most recent first)
          cache.data.memes.unshift(meme);
          
          // Add to liked memes cache if the meme is liked
          if (meme.liked) {
            cache.data.likedMemes.unshift(meme);
          }
          
          // Add to saved memes cache if the meme is saved
          if (meme.saved) {
            cache.data.savedMemes.unshift(meme);
          }
          
          // Add to first page
          if (!cache.data.allPages[1]) {
            cache.data.allPages[1] = {
              memes: [meme],
              likedMemes: meme.liked ? [meme] : [],
              savedMemes: meme.saved ? [meme] : []
            };
          } else {
            cache.data.allPages[1].memes.unshift(meme);
            
            // Add to page-specific liked memes if liked
            if (meme.liked) {
              cache.data.allPages[1].likedMemes.unshift(meme);
            }
            
            // Add to page-specific saved memes if saved
            if (meme.saved) {
              cache.data.allPages[1].savedMemes.unshift(meme);
            }
          }
          
          // Update timestamp
          cache.timestamp = now;
          cache.expiresAt = now + CACHE_DURATION;
        }
      });
    },

    addMemeToExplorePageCache: (meme: Meme) => {
      const now = Date.now();
      set((state) => {
        const cache = state.explorePageCache;
        if (cache && !get().isExpired(cache.timestamp)) {
          // Add to beginning of the search memes list (most recent first)
          cache.data.searchMemes.unshift(meme);
          
          // Add to liked memes cache if the meme is liked
          if (meme.liked) {
            cache.data.likedMemes.unshift(meme);
          }
          
          // Add to saved memes cache if the meme is saved
          if (meme.saved) {
            cache.data.savedMemes.unshift(meme);
          }
          
          // Add to first page
          if (!cache.data.allPages[1]) {
            cache.data.allPages[1] = {
              searchMemes: [meme],
              likedMemes: meme.liked ? [meme] : [],
              savedMemes: meme.saved ? [meme] : []
            };
          } else {
            cache.data.allPages[1].searchMemes.unshift(meme);
            
            // Add to page-specific liked memes if liked
            if (meme.liked) {
              cache.data.allPages[1].likedMemes.unshift(meme);
            }
            
            // Add to page-specific saved memes if saved
            if (meme.saved) {
              cache.data.allPages[1].savedMemes.unshift(meme);
            }
          }
          
          // Update timestamp
          cache.timestamp = now;
          cache.expiresAt = now + CACHE_DURATION;
        }
      });
    },

    updateMemeInMainPageCache: (memeId: string, updates: Partial<Meme>) => {
      const now = Date.now();
      set((state) => {
        const cache = state.mainPageCache;
        if (cache && !get().isExpired(cache.timestamp)) {
          // Update in main memes array
          const memeIndex = cache.data.memes.findIndex(meme => meme.id === memeId);
          if (memeIndex !== -1) {
            const updatedMeme = { ...cache.data.memes[memeIndex], ...updates };
            cache.data.memes[memeIndex] = updatedMeme;
            
            // Handle liked memes cache
            const likedIndex = cache.data.likedMemes.findIndex(meme => meme.id === memeId);
            if (updatedMeme.liked && likedIndex === -1) {
              // Add to liked memes if now liked and not already there
              cache.data.likedMemes.unshift(updatedMeme);
            } else if (!updatedMeme.liked && likedIndex !== -1) {
              // Remove from liked memes if no longer liked
              cache.data.likedMemes.splice(likedIndex, 1);
            } else if (updatedMeme.liked && likedIndex !== -1) {
              // Update existing liked meme
              cache.data.likedMemes[likedIndex] = updatedMeme;
            }
            
            // Handle saved memes cache
            const savedIndex = cache.data.savedMemes.findIndex(meme => meme.id === memeId);
            if (updatedMeme.saved && savedIndex === -1) {
              // Add to saved memes if now saved and not already there
              cache.data.savedMemes.unshift(updatedMeme);
            } else if (!updatedMeme.saved && savedIndex !== -1) {
              // Remove from saved memes if no longer saved
              cache.data.savedMemes.splice(savedIndex, 1);
            } else if (updatedMeme.saved && savedIndex !== -1) {
              // Update existing saved meme
              cache.data.savedMemes[savedIndex] = updatedMeme;
            }
            
            // Update in all pages
            Object.keys(cache.data.allPages).forEach(pageNum => {
              const pageData = cache.data.allPages[parseInt(pageNum)];
              
              // Update in page memes
              const pageMemeIndex = pageData.memes.findIndex(meme => meme.id === memeId);
              if (pageMemeIndex !== -1) {
                pageData.memes[pageMemeIndex] = updatedMeme;
              }
              
              // Update in page liked memes
              const pageLikedIndex = pageData.likedMemes.findIndex(meme => meme.id === memeId);
              if (updatedMeme.liked && pageLikedIndex === -1 && pageMemeIndex !== -1) {
                pageData.likedMemes.unshift(updatedMeme);
              } else if (!updatedMeme.liked && pageLikedIndex !== -1) {
                pageData.likedMemes.splice(pageLikedIndex, 1);
              } else if (updatedMeme.liked && pageLikedIndex !== -1) {
                pageData.likedMemes[pageLikedIndex] = updatedMeme;
              }
              
              // Update in page saved memes
              const pageSavedIndex = pageData.savedMemes.findIndex(meme => meme.id === memeId);
              if (updatedMeme.saved && pageSavedIndex === -1 && pageMemeIndex !== -1) {
                pageData.savedMemes.unshift(updatedMeme);
              } else if (!updatedMeme.saved && pageSavedIndex !== -1) {
                pageData.savedMemes.splice(pageSavedIndex, 1);
              } else if (updatedMeme.saved && pageSavedIndex !== -1) {
                pageData.savedMemes[pageSavedIndex] = updatedMeme;
              }
            });
            
            // Update timestamp
            cache.timestamp = now;
            cache.expiresAt = now + CACHE_DURATION;
          }
        }
      });
    },

    updateMemeInExplorePageCache: (memeId: string, updates: Partial<Meme>) => {
      const now = Date.now();
      set((state) => {
        const cache = state.explorePageCache;
        if (cache && !get().isExpired(cache.timestamp)) {
          // Update in search memes array
          const memeIndex = cache.data.searchMemes.findIndex(meme => meme.id === memeId);
          if (memeIndex !== -1) {
            const updatedMeme = { ...cache.data.searchMemes[memeIndex], ...updates };
            cache.data.searchMemes[memeIndex] = updatedMeme;
            
            // Handle liked memes cache
            const likedIndex = cache.data.likedMemes.findIndex(meme => meme.id === memeId);
            if (updatedMeme.liked && likedIndex === -1) {
              // Add to liked memes if now liked and not already there
              cache.data.likedMemes.unshift(updatedMeme);
            } else if (!updatedMeme.liked && likedIndex !== -1) {
              // Remove from liked memes if no longer liked
              cache.data.likedMemes.splice(likedIndex, 1);
            } else if (updatedMeme.liked && likedIndex !== -1) {
              // Update existing liked meme
              cache.data.likedMemes[likedIndex] = updatedMeme;
            }
            
            // Handle saved memes cache
            const savedIndex = cache.data.savedMemes.findIndex(meme => meme.id === memeId);
            if (updatedMeme.saved && savedIndex === -1) {
              // Add to saved memes if now saved and not already there
              cache.data.savedMemes.unshift(updatedMeme);
            } else if (!updatedMeme.saved && savedIndex !== -1) {
              // Remove from saved memes if no longer saved
              cache.data.savedMemes.splice(savedIndex, 1);
            } else if (updatedMeme.saved && savedIndex !== -1) {
              // Update existing saved meme
              cache.data.savedMemes[savedIndex] = updatedMeme;
            }
            
            // Update in all pages
            Object.keys(cache.data.allPages).forEach(pageNum => {
              const pageData = cache.data.allPages[parseInt(pageNum)];
              
              // Update in page search memes
              const pageSearchIndex = pageData.searchMemes.findIndex(meme => meme.id === memeId);
              if (pageSearchIndex !== -1) {
                pageData.searchMemes[pageSearchIndex] = updatedMeme;
              }
              
              // Update in page liked memes
              const pageLikedIndex = pageData.likedMemes.findIndex(meme => meme.id === memeId);
              if (updatedMeme.liked && pageLikedIndex === -1 && pageSearchIndex !== -1) {
                pageData.likedMemes.unshift(updatedMeme);
              } else if (!updatedMeme.liked && pageLikedIndex !== -1) {
                pageData.likedMemes.splice(pageLikedIndex, 1);
              } else if (updatedMeme.liked && pageLikedIndex !== -1) {
                pageData.likedMemes[pageLikedIndex] = updatedMeme;
              }
              
              // Update in page saved memes
              const pageSavedIndex = pageData.savedMemes.findIndex(meme => meme.id === memeId);
              if (updatedMeme.saved && pageSavedIndex === -1 && pageSearchIndex !== -1) {
                pageData.savedMemes.unshift(updatedMeme);
              } else if (!updatedMeme.saved && pageSavedIndex !== -1) {
                pageData.savedMemes.splice(pageSavedIndex, 1);
              } else if (updatedMeme.saved && pageSavedIndex !== -1) {
                pageData.savedMemes[pageSavedIndex] = updatedMeme;
              }
            });
            
            // Update timestamp
            cache.timestamp = now;
            cache.expiresAt = now + CACHE_DURATION;
          }
        }
      });
    },

    clearAllCache: () => {
      set((state) => {
        state.mainPageCache = null;
        state.explorePageCache = null;
        state.searchCache.clear();
      });
    },

    isExpired: (timestamp: number) => {
      return Date.now() > timestamp + CACHE_DURATION;
    },
  }))
);

export const useCacheStore = createSelectors(useRawCacheStore);