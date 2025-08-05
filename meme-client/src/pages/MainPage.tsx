import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, RefreshCw, WifiOff } from "lucide-react";
import { useMemeContentStore } from "../store/useMemeContentStore.ts";
import { useUserStore } from "../store/useUserStore.ts";
import { MemeCard } from "../components/mainPage/MemeCard";
import { SkeletonCard } from "../components/ui/SkeletonCard";
import { TrueMasonryGrid } from "../components/mainPage/TrueMasonryGrid";
import { useNavigate } from "react-router-dom";
import { useScrollPerformance, useMomentumScroll } from "../hooks/useSmoothScroll";

export const MainPage: React.FC = () => {
  const memes = useMemeContentStore.use.memes();
  const fetchMemes = useMemeContentStore.use.fetchMemes();
  const fetchMoreMemes = useMemeContentStore.use.fetchMoreMemes();
  const isLoading = useMemeContentStore.use.isLoading();
  const isLoadingMore = useMemeContentStore.use.isLoadingMore();
  const hasMoreMemes = useMemeContentStore.use.hasMoreMemes();
  const error = useMemeContentStore.use.error();
  const userName = useUserStore.use.userName();

  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const loadingRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const isLoadingMoreRef = useRef(isLoadingMore);

  useScrollPerformance(scrollContainerRef as React.RefObject<HTMLElement>);
  useMomentumScroll(scrollContainerRef as React.RefObject<HTMLElement>);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (error && retryCount < 3) {
        setTimeout(() => {
          fetchMemes();
          setRetryCount((prev) => prev + 1);
        }, 1000);
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [error, retryCount, fetchMemes]);

  useEffect(() => {
    const fetchWithRetry = async () => {
      try {
        await fetchMemes();
        setRetryCount(0);
      } catch (err) {
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            fetchWithRetry();
          }, Math.pow(2, retryCount) * 1000);
        }
      }
    };

    fetchWithRetry();
  }, [fetchMemes]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await fetchMemes();
      setRetryCount(0);

      const refreshFeedback = document.createElement("div");
      refreshFeedback.className =
        "fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300";
      refreshFeedback.textContent = "Content refreshed!";
      document.body.appendChild(refreshFeedback);

      setTimeout(() => {
        refreshFeedback.style.opacity = "0";
        setTimeout(() => document.body.removeChild(refreshFeedback), 300);
      }, 2000);
    } catch (err) {
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, fetchMemes]);

  useEffect(() => {
    if (!userName) return;
    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1);

      const bellElement = document.querySelector("[data-notification-bell]");
      if (bellElement) {
        bellElement.classList.add("animate-bounce");
        setTimeout(() => bellElement.classList.remove("animate-bounce"), 1000);
      }
    };

    const handleNotificationsRead = () => {
      setUnreadCount(0);
    };

    window.addEventListener("new-notification", handleNewNotification);
    window.addEventListener("notifications-read", handleNotificationsRead);

    return () => {
      window.removeEventListener("new-notification", handleNewNotification);
      window.removeEventListener("notifications-read", handleNotificationsRead);
    };
  }, [userName]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    if (!loadingRef.current || !hasMoreMemes) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoading && !isLoadingMoreRef.current && hasMoreMemes) {
          fetchMoreMemes();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "300px",
        root: null,
      }
    );

    observer.observe(loadingRef.current);
    return () => {
      observer.disconnect();
    };
  }, [hasMoreMemes, isLoading, fetchMoreMemes]);

  const handleOptionsClick = (id: string | null) => {
    setActiveOptionsId(id);
  };

  const renderSkeletonCards = (count: number = 15) => {
    return Array.from({ length: count }, (_, index) => (
      <div
        key={`skeleton-${index}`}
        className="animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <SkeletonCard index={index} />
      </div>
    ));
  };

  const ErrorComponent = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="bg-red-50 p-6 rounded-2xl mb-6 border border-red-100">
        {isOnline ? (
          <RefreshCw className="w-12 h-12 text-red-400 mx-auto mb-4" />
        ) : (
          <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
        )}
        <h3 className="text-xl font-bold text-red-800 mb-2">
          {isOnline ? "Something went wrong" : "You're offline"}
        </h3>
        <p className="text-red-600 mb-6 max-w-md">
          {isOnline
            ? "We couldn't load the memes. Please check your connection and try again."
            : "Please check your internet connection and try again."}
        </p>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Retrying..." : "Try Again"}
        </button>
      </div>
      {retryCount > 0 && (
        <p className="text-sm text-gray-500">Retry attempt {retryCount} of 3</p>
      )}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl mb-6 border border-blue-100">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl mb-6 inline-block">
          <Bell className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          Welcome to Mekoole!
        </h3>
        <p className="text-gray-600 max-w-md mb-6 leading-relaxed">
          Be the first to share something amazing! Start by uploading your first
          meme and join our community.
        </p>
        <button
          onClick={() => navigate("/upload")}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Upload Your First Meme
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative h-full overflow-auto scrollbar-hide ultra-smooth-scroll smooth-transitions" ref={scrollContainerRef}>
      <div className="lg:hidden sticky top-0 left-0 right-0 z-40 bg-white dark:bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-blue-600 text-transparent bg-clip-text">
              Mekool
            </h1>
            {!isOnline && (
              <div className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                <WifiOff className="w-3 h-3" />
                Offline
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              title="Refresh content"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </button>

            <div className="relative">
              <button
                data-notification-bell
                onClick={() => {
                  navigate(`/notifications`);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 transform hover:scale-105"
              >
                <Bell className="w-6 h-6 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto pl-4 pr-2 sm:px-4 lg:px-4 pt-2 lg:pt-2">
        {error ? (
          <ErrorComponent />
        ) : isLoading && memes.length === 0 ? (
          <TrueMasonryGrid className="px-2 sm:px-4 lg:gap-6 gap-0">
            {renderSkeletonCards(15)}
          </TrueMasonryGrid>
        ) : memes.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            <TrueMasonryGrid className="pl-2 pr-0 sm:px-4 lg:gap-6 gap-0">
              {memes.map((meme, index) => (
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

            <div ref={loadingRef} className="w-full py-8">
              {isLoadingMore && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">Loading more memes...</span>
                </div>
              )}
              {!hasMoreMemes && memes.length > 0 && (
                <div className="text-center py-8 animate-fade-in">
                  <h3 className="text-xl font-bold text-gray-700 mb-2">
                    You've reached the end!
                  </h3>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainPage;
