import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMemeContentStore } from "../store/useMemeContentStore";
import { useUserStore } from "../store/useUserStore";
import useWebSocketStore from "../hooks/useWebSockets";
import { useAuthCheck } from "../hooks/useAuth";
import { useAuthContext } from "../hooks/useAuthContext";
import toast from "react-hot-toast";
import type { Comment, Meme } from "../types/mems";

import { NavigationHeader } from "../components/MemeDetails/navigation-header";
import { MediaViewer } from "../components/MemeDetails/media-viewer";
import { ActionButtons } from "../components/MemeDetails/action-buttons";
import { UserInfo } from "../components/MemeDetails/user-info";
import { StatsDisplay } from "../components/MemeDetails/stats-display";
import { CommentsSection } from "../components/MemeDetails/comments-section";
import { MobileCommentModal } from "../components/MemeDetails/mobile-comment-modal";
import { LoadingSpinner } from "../components/MemeDetails/loading-spinner";
import { NotFound } from "../components/MemeDetails/not-found";
import { MemeCard } from "../components/mainPage/MemeCard";
import { TrueMasonryGrid } from "../components/mainPage/TrueMasonryGrid";
import { SkeletonCard } from "../components/ui/SkeletonCard";
import { LoginPromptModal } from "../components/MemeDetails/LoginPromptModal";

const MemeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [moreMemes, setMoreMemes] = useState<Meme[]>([]);
  const [isLoadingMoreMemes, setIsLoadingMoreMemes] = useState(false);
  const [hasMoreMemes, setHasMoreMemes] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthCheck();
  const { username: authUsername, userId: authUserId } = useAuthContext();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginAction, setLoginAction] = useState("");

  const [initialLikeState, setInitialLikeState] = useState<boolean | null>(
    null
  );
  const [initialSaveState, setInitialSaveState] = useState<boolean | null>(
    null
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreMemesRef = useRef(isLoadingMoreMemes);
  const hasMoreMemesRef = useRef(hasMoreMemes);
  const currentPageRef = useRef(currentPage);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const commentsPerPage = 10;
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const memes = useMemeContentStore.use.memes();
  const recomendedMemes = useMemeContentStore.use.recomendedMemes();
  const likedMemes = useMemeContentStore.use.likedMemes();
  const savedMemes = useMemeContentStore.use.savedMemes();
  const selectedMeme = useMemeContentStore.use.selectedMeme();
  const toggleLike = useMemeContentStore.use.toggleLike();
  const toggleSave = useMemeContentStore.use.toggleSave();
  const fetchMemeById = useMemeContentStore.use.fetchMemeById();
  const fetchMemeComments = useMemeContentStore.use.fetchMemeComments();
  const isLoading = useMemeContentStore.use.isLoading();
  const joinPostSession = useMemeContentStore.use.joinPostSession();
  const leavePostSession = useMemeContentStore.use.leavePostSession();

  const fetchUserProfile = useUserStore.use.fetchUserProfile();
  const profilePictureUrl = useUserStore.use.loggedInUserProfilePictureUrl();
  const isLoggedInUserProfileLoaded =
    useUserStore.use.isLoggedInUserProfileLoaded();
  const userLikedMemes = useUserStore.use.likedMemes();
  const userSavedMemes = useUserStore.use.savedMemes();
  const loggedInUserProfile = useUserStore.use.loggedInUserProfile();

  const { client: wsClient } = useWebSocketStore();

  const meme =
    (selectedMeme && selectedMeme.id === id ? selectedMeme : null) ||
    memes.find((m) => m.id === id) ||
    recomendedMemes.find((m) => m.id === id) ||
    likedMemes.find((m) => m.id === id) ||
    savedMemes.find((m) => m.id === id);

  const isVideo = meme?.url?.match(/\.(mp4|webm|ogg)$/i);

  const calculateLikeStatus = useCallback(() => {
    if (!meme || !id) return false;

    if (meme.liked !== undefined) {
      if (initialLikeState === null && meme.liked) {
        setInitialLikeState(true);
      }

      return meme.liked;
    }

    const isLikedInStore = likedMemes.some((m) => m.id === meme.id);
    const isLikedInUserProfile =
      loggedInUserProfile && userLikedMemes.some((m) => m.id === meme.id);

    const calculatedState = isLikedInStore || isLikedInUserProfile;

    if (initialLikeState === null && (isLikedInStore || isLikedInUserProfile)) {
      setInitialLikeState(calculatedState);
    }

    return calculatedState || initialLikeState === true;
  }, [
    meme,
    id,
    likedMemes,
    loggedInUserProfile,
    userLikedMemes,
    initialLikeState,
  ]);

  const calculateSaveStatus = useCallback(() => {
    if (!meme || !id) return false;

    if (meme.saved !== undefined) {

      if (initialSaveState === null && meme.saved) {
        setInitialSaveState(true);
      }

      return meme.saved;
    }

    const isSavedInStore = savedMemes.some((m) => m.id === meme.id);

    const isSavedInUserProfile =
      loggedInUserProfile && userSavedMemes.some((m) => m.id === meme.id);

    const calculatedState = isSavedInStore || isSavedInUserProfile;

    if (initialSaveState === null && (isSavedInStore || isSavedInUserProfile)) {
      setInitialSaveState(calculatedState);
    }

    return calculatedState || initialSaveState === true;
  }, [
    meme,
    id,
    savedMemes,
    loggedInUserProfile,
    userSavedMemes,
    initialSaveState,
  ]);

  const isLiked = calculateLikeStatus();
  const isSaved = calculateSaveStatus();

  const commentCount = meme?.commentsCount || comments.length || 0;

  const sessionJoinedRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    isLoadingMoreMemesRef.current = isLoadingMoreMemes;
  }, [isLoadingMoreMemes]);

  useEffect(() => {
    hasMoreMemesRef.current = hasMoreMemes;
  }, [hasMoreMemes]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const handleBack = () => navigate(-1);

  const fetchRecomendedMemes = useMemeContentStore.use.fetchRecomendedMemes();

  useEffect(() => {
    if (!meme || !id) return;

    if (initialLikeState === true && !likedMemes.some((m) => m.id === id)) {
      useMemeContentStore.setState((state) => ({
        likedMemes: [...state.likedMemes, meme],
      }));
    }

    if (initialSaveState === true && !savedMemes.some((m) => m.id === id)) {
      useMemeContentStore.setState((state) => ({
        savedMemes: [...state.savedMemes, meme],
      }));
    }
  }, [meme, id, likedMemes, savedMemes, initialLikeState, initialSaveState]);

  useEffect(() => {
    setInitialLikeState(null);
    setInitialSaveState(null);
    setIsInitialLoading(true);
  }, [id]);

  const fetchMoreMemes = useCallback(async (page = 1) => {    
    if (!isAuthenticated || isLoadingMoreMemesRef.current || !id) {
      return;
    }

    setIsLoadingMoreMemes(true);

    try {
      const result = await fetchRecomendedMemes(id, authUserId || "", page);      
      if (!result || !result.memes || result.memes.length === 0) {
        setHasMoreMemes(false);
        setIsLoadingMoreMemes(false);
        return;
      }

      if (page === 1) {
        setMoreMemes(result.memes);
      } else {
        setMoreMemes((prev) => {
          const existingIds = new Set(prev.map((meme) => meme.id));
          const uniqueNewMemes = result.memes.filter(
            (meme) => !existingIds.has(meme.id)
          );
          return [...prev, ...uniqueNewMemes];
        });
      }

      setHasMoreMemes(result.hasMore);
      setCurrentPage(result.currentPage);
    } catch (error) {
      console.error("fetchMoreMemes error:", error);
      toast.error("Failed to load recommended memes");

      if (page === 1) {
        setMoreMemes([]);
      }

      setHasMoreMemes(false);
    } finally {
      setIsLoadingMoreMemes(false);
    }
  }, [isAuthenticated, id, authUserId, fetchRecomendedMemes]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    
    if (id && isAuthenticated === true) {
      setMoreMemes([]);
      setHasMoreMemes(true);
      setCurrentPage(1);
      fetchMoreMemes(1);
    } else if (id && isAuthenticated === false) {
      setMoreMemes([]);
      setHasMoreMemes(false);
      setCurrentPage(1);
    }
  }, [id, fetchMoreMemes, isAuthenticated, isAuthLoading]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !id) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Use refs to get current values
          if (!isLoadingMoreMemesRef.current && hasMoreMemesRef.current) {
            fetchMoreMemes(currentPageRef.current + 1);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [id, fetchMoreMemes, isAuthenticated, isAuthLoading]);

  useEffect(() => {
    if (recomendedMemes && recomendedMemes.length > 0) {
      if (currentPage === 1) {
        setMoreMemes(recomendedMemes);
      }
    }
  }, [recomendedMemes, currentPage, id]);

  useEffect(() => {
    sessionJoinedRef.current = false;

    const initializePage = async () => {
      if (id) {
        try {
          // Always fetch the meme, regardless of authentication status
          const fetchedMeme = await fetchMemeById(id);
          
          if (!fetchedMeme) {
            console.error("MemeDetailPage: Failed to fetch meme with ID:", id);
          }

          // Only do authentication-specific actions if user is authenticated
          if (isAuthenticated && !sessionJoinedRef.current) {
            joinPostSession(id);
            sessionJoinedRef.current = true;
          }
          
          setCommentsPage(1);
          setHasMoreComments(true);
          setComments([]);

          if (isAuthenticated) {
            try {
              const initialResult = await fetchMemeComments(id, 1, commentsPerPage);
              setComments(initialResult.comments);
              setCommentsPage(initialResult.currentPage);
              setHasMoreComments(
                initialResult.currentPage < (initialResult.totalPages ?? 1)
              );
            } catch (error) {}
          }

          if (isAuthenticated && authUserId && !isLoggedInUserProfileLoaded) {
            await fetchUserProfile(authUsername || "");
          } else if (isAuthenticated && authUserId && isLoggedInUserProfileLoaded) {
          }
        } finally {
          setIsInitialLoading(false);
        }
      }
    };

    initializePage();

    const handleWebSocketReconnect = () => {
      if (id && sessionJoinedRef.current) {
        joinPostSession(id);
        fetchMemeById(id).then((refreshedMeme) => {
          if (refreshedMeme) {
          }
        });
      }
    };

    window.addEventListener("websocket-reconnected", handleWebSocketReconnect);

    return () => {
      if (id && sessionJoinedRef.current) {
        leavePostSession(id);
        sessionJoinedRef.current = false;
      }

      window.removeEventListener(
        "websocket-reconnected",
        handleWebSocketReconnect
      );
    };
  }, [
    id,
    fetchMemeById,
    fetchMemeComments,
    fetchUserProfile,
    authUserId,
    joinPostSession,
    leavePostSession,
    isLoggedInUserProfileLoaded,
    authUsername,
    isAuthenticated,
  ]);

  const loadMoreComments = useCallback(async () => {
    if (!id || isLoadingMoreComments || !hasMoreComments) {
      return;
    }
    try {
      setIsLoadingMoreComments(true);
      const nextPage = commentsPage + 1;

      const result = await fetchMemeComments(id, nextPage, commentsPerPage);

      if (result && result.comments && Array.isArray(result.comments)) {
        setComments((prevComments) => {
          const newComments = [...prevComments, ...result.comments];
          return newComments;
        });

        setCommentsPage(nextPage);

        const hasMore =
          result.comments.length === commentsPerPage &&
          (result.totalPages ? nextPage < result.totalPages : true);

        setHasMoreComments(hasMore);
      } else {
        setHasMoreComments(false);
      }
    } catch (error) {
      console.error("Error loading more comments:", error);
      toast.error("Failed to load more comments");
      setHasMoreComments(false);
    } finally {
      setIsLoadingMoreComments(false);
    }
  }, [
    id,
    isLoadingMoreComments,
    hasMoreComments,
    commentsPage,
    commentsPerPage,
    fetchMemeComments,
  ]);

  useEffect(() => {
    if (!commentsEndRef.current || !hasMoreComments || isLoadingMoreComments) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          loadMoreComments();
        }
      },
      {
        threshold: [0, 0.1, 0.5],
        rootMargin: "50px",
        root: null,
      }
    );

    observer.observe(commentsEndRef.current);
    return () => {
      observer.disconnect();
    };
  }, [
    hasMoreComments,
    isLoadingMoreComments,
    loadMoreComments,
    isCommentModalOpen,
    comments.length,
  ]);

  useEffect(() => {
    if (!id || !meme) return;

    const unsubscribe = useMemeContentStore.subscribe((state) => {
      const updatedMeme = state.selectedMeme;
      if (updatedMeme && updatedMeme.id === id && updatedMeme.comments) {
        if (updatedMeme.comments.length > comments.length) {
          setComments((prevComments) => {
            const existingIds = new Set(prevComments.map((c) => c.id));
            const newComments = updatedMeme.comments.filter(
              (c) => !existingIds.has(c.id)
            );

            if (newComments.length > 0) {
              return [...newComments, ...prevComments];
            }

            return prevComments;
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id, meme, comments.length, commentCount]);

  useEffect(() => {
    if (isCommentModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isCommentModalOpen]);

  const handleLoadMore = () => {
    if (hasMoreMemesRef.current && !isLoadingMoreMemesRef.current) {
      fetchMoreMemes(currentPageRef.current + 1);
    }
  };

  const handleOptionsClick = (id: string | null) => {
    setActiveOptionsId(id);
  };

  const renderSkeletonCards = (count = 6) => {
    return Array.from({ length: count }, (_, index) => (
      <SkeletonCard key={`skeleton-${index}-${Date.now()}`} index={index} />
    ));
  };

  if (isLoading || isInitialLoading) {
    return <LoadingSpinner />;
  }

  if (!meme) {
    return <NotFound onBack={handleBack} />;
  }

  // const handleDownload = async () => {
  //   try {
  //     if (!meme.url) {
  //       toast.error("Cannot download: Media URL is missing");
  //       return;
  //     }

  //     const response = await fetch(meme.url);
  //     const blob = await response.blob();
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = `${meme.title}${isVideo ? ".mp4" : ".jpg"}`;
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("Error downloading meme:", error);
  //     toast.error("Failed to download media. Please try again.");
  //   }
  // };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link. Please try again.");
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setLoginAction("comment on this meme");
      setLoginModalOpen(true);
      return;
    }

    if (comment.trim() && id) {
      if (!wsClient) {
        useWebSocketStore.getState().restoreConnection();

        setTimeout(() => {
          const newWsClient = useWebSocketStore.getState().client;

          if (!newWsClient || newWsClient.readyState !== WebSocket.OPEN) {
            toast.error(
              "Cannot add comment: WebSocket connection not established"
            );
            return;
          } else {
            sendComment();
          }
        }, 1000);

        return;
      }

      sendComment();
    }
  };

  const sendComment = () => {
    if (!id || !comment.trim()) return;

    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      memeId: id,
      userId: authUserId || "",
      username: authUsername || "",
      text: comment.trim(),
      createdAt: new Date().toISOString(),
      profilePictureUrl: profilePictureUrl || "",
    };

    setComments((prevComments) => [optimisticComment, ...prevComments]);

    const updatedCommentCount = commentCount + 1;

    if (meme) {
      useMemeContentStore.setState((state) => ({
        selectedMeme: state.selectedMeme
          ? {
              ...state.selectedMeme,
              commentsCount: updatedCommentCount,
            }
          : null,
      }));
    }

    const success = useWebSocketStore
      .getState()
      .sendCommentRequest(id, comment.trim(), profilePictureUrl || "");

    if (success) {
      setComment("");

      if (window.innerWidth < 1024) {
        setIsCommentModalOpen(false);
      }

      toast.success("Comment sent successfully");

      useMemeContentStore.getState().forceAddComment(optimisticComment);
    } else {
      setComments((prevComments) =>
        prevComments.filter((c) => c.id !== optimisticComment.id)
      );
      toast.error("Failed to send comment. Please try again.");
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      setLoginAction("like this meme");
      setLoginModalOpen(true);
      return;
    }

    if (authUsername && meme.id) {
      const currentlyLiked = isLiked;
      await toggleLike(meme.id, authUsername);
      if (wsClient) {
        const action = currentlyLiked ? "UNLIKE" : "LIKE";

        useWebSocketStore.getState().sendMessage({
          type: "LIKE",
          memeId: meme.id,
          action: action,
          username: authUsername,
          userId: authUserId,
        });
      }
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      setLoginAction("save this meme");
      setLoginModalOpen(true);
      return;
    }

    if (authUsername && meme.id) {
      const currentlySaved = isSaved;
      await toggleSave(meme.id, authUsername);

      if (wsClient) {
        // The action should be the opposite of the current state since we're toggling
        const action = currentlySaved ? "UNSAVE" : "SAVE";

        useWebSocketStore.getState().sendMessage({
          type: "SAVE",
          memeId: meme.id,
          action: action,
          username: authUsername,
          userId: authUserId,
        });
      }
    }
  };

  const navigateToProfile = (username: string) => {
    navigate(`/profile/${username}`);

    if (username !== authUsername || !isLoggedInUserProfileLoaded) {
      fetchUserProfile(username);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 meme-detail-page">
      <NavigationHeader onBack={handleBack} onShare={handleShare} />

      <main className="max-w-full mx-auto px-3 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden meme-detail-card transition-colors duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              <MediaViewer
                url={meme.url || ""}
                title={meme.title || ""}
                isVideo={!!isVideo}
              />

              <div className="p-6 flex flex-col h-full bg-white dark:bg-[#1a1a1a] meme-detail-content">
                <ActionButtons
                  isLiked={isLiked}
                  isSaved={isSaved}
                  onLike={handleLike}
                  onSave={handleSave}
                  // onDownload={handleDownload}
                />

                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-black dark:text-white leading-tight">
                    {meme.title}
                  </h1>
                </div>

                <UserInfo
                  username={meme.uploader}
                  profilePictureUrl={meme.profilePictureUrl}
                  createdAt={meme.memeCreated || Date()}
                  onProfileClick={navigateToProfile}
                />

                <StatsDisplay
                  likeCount={meme.likeCount || 0}
                  commentCount={commentCount}
                  saveCount={meme.saveCount || 0}
                />

                <CommentsSection
                  comments={comments}
                  commentCount={commentCount}
                  comment={comment}
                  setComment={setComment}
                  onSubmitComment={handleSubmitComment}
                  onProfileClick={navigateToProfile}
                  onOpenModal={() => setIsCommentModalOpen(true)}
                  isLoadingMoreComments={isLoadingMoreComments}
                  hasMoreComments={hasMoreComments}
                  commentsEndRef={commentsEndRef}
                  isCommentModalOpen={isCommentModalOpen}
                  wsClient={wsClient}
                  isAuthenticated={isAuthenticated || false}
                />
              </div>
            </div>
          </div>
        </div>

        {isAuthenticated && (moreMemes.length > 0 || isLoadingMoreMemes) && (
          <div className="max-w-7xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-6 px-4 text-gray-900 dark:text-gray-100">
              Recommended Memes
            </h2>
            {isLoadingMoreMemes && moreMemes.length === 0 ? (
              <TrueMasonryGrid className="px-2 sm:px-4">
                {renderSkeletonCards()}
              </TrueMasonryGrid>
            ) : (
              <TrueMasonryGrid className="px-2 sm:px-4">
                {moreMemes.map((recommendedMeme) => (
                  <MemeCard
                    key={recommendedMeme.id}
                    meme={recommendedMeme}
                    activeOptionsId={activeOptionsId}
                    onOptionsClick={handleOptionsClick}
                  />
                ))}

                {isLoadingMoreMemes &&
                  moreMemes.length > 0 &&
                  renderSkeletonCards()}
              </TrueMasonryGrid>
            )}

            {hasMoreMemes && moreMemes.length > 0 && (
              <div
                ref={loadMoreRef}
                className="h-10 w-full flex items-center justify-center my-8"
              >
                {isLoadingMoreMemes ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      Loading more memes...
                    </span>
                  </div>
                ) : (
                  <div className="h-1 w-full"></div>
                )}
              </div>
            )}

            {!hasMoreMemes && moreMemes.length > 0 && (
              <div className="text-center mt-8 mb-8 text-slate-600 dark:text-slate-400">
                <p>You've seen all the recommended memes!</p>
              </div>
            )}
          </div>
        )}
      </main>

      <MobileCommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        comments={comments}
        commentCount={commentCount}
        comment={comment}
        setComment={setComment}
        onSubmitComment={handleSubmitComment}
        onProfileClick={navigateToProfile}
        isLoadingMoreComments={isLoadingMoreComments}
        hasMoreComments={hasMoreComments}
        commentsEndRef={commentsEndRef}
        wsClient={wsClient}
        isAuthenticated={isAuthenticated || false}
      />

      <LoginPromptModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        action={loginAction}
      />
    </div>
  );
};

export default MemeDetailPage;
