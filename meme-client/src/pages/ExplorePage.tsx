import React, { useEffect } from "react";
import { useMemeContentStore } from "../store/useMemeContentStore";
import { MemeCard } from "../components/mainPage/MemeCard";
import { UserCard } from "../components/ui/userCard";
import { SkeletonCard } from "../components/ui/SkeletonCard";
import { TrueMasonryGrid } from "../components/mainPage/TrueMasonryGrid";
import { Search, X, Users } from "lucide-react";
import type { UserApi } from "../types/mems";
import { useNavigate } from "react-router-dom";
import { useScrollPerformance, useMomentumScroll } from "../hooks/useSmoothScroll";
import { useAuthContext } from "../hooks/useAuthContext";

export const ExplorePage = () => {
  const { username, isAuthenticated } = useAuthContext();
  const searchUsers = useMemeContentStore.use.searchUsers();
  const searchMemes = useMemeContentStore.use.searchMemes();
  const searchMemesAndUsers = useMemeContentStore.use.searchMemesAndUsers();
  const discoverMemes = useMemeContentStore.use.discoverMemes();
  const fetchMoreDiscoverMemes = useMemeContentStore.use.fetchMoreDiscoverMemes();
  const fetchMemes = useMemeContentStore.use.fetchMemes();
  const clearSearchResults = useMemeContentStore.use.clearSearchResults();
  const isLoading = useMemeContentStore.use.isLoading();
  const isLoadingMore = useMemeContentStore.use.isLoadingMore();
  const hasMoreMemes = useMemeContentStore.use.hasMoreMemes();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [hasSearched, setHasSearched] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [activeOptionsId, setActiveOptionsId] = React.useState<string | null>(
    null
  );
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const loadingRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const isLoadingRef = React.useRef(isLoading);
  const isLoadingMoreRef = React.useRef(isLoadingMore);
  const hasSearchedRef = React.useRef(hasSearched);
  const hasMoreMemesRef = React.useRef(hasMoreMemes);

  const displayMemes = searchMemes;
  const totalResults = hasSearched
    ? searchUsers.length + searchMemes.length
    : searchMemes.length;

  useScrollPerformance(scrollContainerRef as React.RefObject<HTMLElement>);
  useMomentumScroll(scrollContainerRef as React.RefObject<HTMLElement>);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    hasSearchedRef.current = hasSearched;
  }, [hasSearched]);

  useEffect(() => {
    hasMoreMemesRef.current = hasMoreMemes;
  }, [hasMoreMemes]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      clearSearchResults();
      
      setIsTyping(true);

      if (isAuthenticated && username) {
        await discoverMemes(1, 10);
      } else {
        await fetchMemes();
      }

      setIsTyping(false);
      setInitialLoadDone(true);
    };
    
    loadInitialData();
  }, [isAuthenticated, username, clearSearchResults, discoverMemes, fetchMemes]);

  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = React.useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [initialLoadDone, setInitialLoadDone] = React.useState(false);
  const [hasUserSearched, setHasUserSearched] = React.useState(false);
  
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      setIsTyping(true);

      const searchPromise = searchMemesAndUsers(debouncedSearchQuery.trim());
      const minDelay = new Promise((resolve) => setTimeout(resolve, 800));

      Promise.all([searchPromise, minDelay]).finally(() => setIsTyping(false));

      setHasSearched(true);
      setHasUserSearched(true);
    } else if (debouncedSearchQuery === "" && initialLoadDone && hasUserSearched) {
      setIsTyping(true);

      clearSearchResults();

      const fetchPromise =
        isAuthenticated && username
          ? discoverMemes(1, 10)
          : fetchMemes();

      const minDelay = new Promise((resolve) => setTimeout(resolve, 400));

      Promise.all([fetchPromise, minDelay]).finally(() => setIsTyping(false));

      setHasSearched(false);
    }
  }, [
    debouncedSearchQuery,
    searchMemesAndUsers,
    discoverMemes,
    clearSearchResults,
    fetchMemes,
    initialLoadDone,
    hasUserSearched,
    isAuthenticated,
    username,
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsTyping(true);

      const searchPromise = searchMemesAndUsers(searchQuery.trim());
      const minDelay = new Promise((resolve) => setTimeout(resolve, 800));

      Promise.all([searchPromise, minDelay]).finally(() => setIsTyping(false));

      setHasSearched(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setHasSearched(false);
    setIsTyping(true);

    clearSearchResults();

    const fetchPromise =
      isAuthenticated && username
        ? discoverMemes(1, 10)
        : fetchMemes();

    const minDelay = new Promise((resolve) => setTimeout(resolve, 400));

    Promise.all([fetchPromise, minDelay]).finally(() => setIsTyping(false));

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleOptionsClick = (id: string | null) => {
    setActiveOptionsId(id);
  };

  const handleUserClick = (user: UserApi) => {
    navigate(`/profile/${user.username}`);
  };

  const renderSkeletonCards = (count: number = 6) => {
    return Array.from({ length: count }, (_, index) => (
      <SkeletonCard key={`skeleton-${index}`} index={index} />
    ));
  };

  useEffect(() => {
    if (!loadingRef.current || !hasMoreMemes || hasSearched) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];        
        if (entry.isIntersecting && 
            !isLoadingRef.current && 
            !isLoadingMoreRef.current && 
            hasMoreMemesRef.current && 
            !hasSearchedRef.current) {
          
          fetchMoreDiscoverMemes();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px",
        root: null,
      }
    );

    observer.observe(loadingRef.current);
    return () => {
      observer.disconnect();
    };
  }, [hasMoreMemes, isLoading, isLoadingMore, hasSearched, fetchMoreDiscoverMemes, displayMemes.length]);

  return (
    <div className="p-4 sm:p-6 pt-6 ultra-smooth-scroll smooth-transitions" ref={scrollContainerRef}>
      <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search memes and users..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                setIsTyping(true);
                setHasUserSearched(true);
              }
            }}
            className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>

      {hasSearched && !isLoading && !isTyping && (
        <div className="max-w-2xl mx-auto mb-6">
          <p className="text-gray-600">
            {totalResults === 0
              ? `No results found for "${searchQuery}"`
              : `Showing ${totalResults} result${
                  totalResults === 1 ? "" : "s"
                } for "${searchQuery}"`}
          </p>
          {searchUsers.length > 0 && searchMemes.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {searchUsers.length} user{searchUsers.length === 1 ? "" : "s"} •{" "}
              {searchMemes.length} meme{searchMemes.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      <div className="w-full mx-auto px-2 sm:px-4">
        {isLoading || isTyping ? (
          <TrueMasonryGrid className="px-2 sm:px-4">
            {renderSkeletonCards()}
          </TrueMasonryGrid>
        ) : totalResults === 0 && hasSearched ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No results found
            </h3>
            <p className="text-gray-500 max-w-md">
              We couldn't find any memes or users matching your search. Try
              using different keywords or browse our trending content.
            </p>
            <button
              onClick={handleClearSearch}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {hasSearched && searchUsers.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Users ({searchUsers.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {searchUsers.map((user) => (
                    <UserCard
                      key={user.userId}
                      user={user}
                      onClick={handleUserClick}
                    />
                  ))}
                </div>
              </div>
            )}
            {displayMemes.length > 0 && (
              <div>
                {hasSearched && searchMemes.length > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Search className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Memes ({searchMemes.length})
                    </h2>
                  </div>
                )}
                <TrueMasonryGrid className="px-2 sm:px-4">
                  {displayMemes.map((meme, index) => (
                    <div
                      key={meme.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <MemeCard
                        meme={meme}
                        activeOptionsId={activeOptionsId}
                        onOptionsClick={handleOptionsClick}
                      />
                    </div>
                  ))}
                  {isLoadingMore && renderSkeletonCards(6)}
                </TrueMasonryGrid>
              </div>
            )}
            {displayMemes.length === 0 && !hasSearched && (
              <div className="text-center py-8 sm:py-12 w-full">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Start exploring
                  </h3>
                  <p className="text-gray-500">
                    Search for memes and users or browse our collection!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div 
        ref={loadingRef} 
        className={`w-full py-8 ${hasSearched ? 'hidden' : ''}`}
      >
        {isLoadingMore && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading more memes...</span>
          </div>
        )}
        {!hasMoreMemes && displayMemes.length > 0 && !hasSearched && (
          <div className="text-center py-8 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-700 mb-2">You've reached the end!</h3>
            <p className="text-gray-500">No more memes to discover right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};