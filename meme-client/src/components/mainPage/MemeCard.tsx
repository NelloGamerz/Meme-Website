import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Trash,
  Share,
  User,
} from "lucide-react";
import { cn } from "../../hooks/utils.ts";
import type { Meme } from "../../types/mems.ts";
import { useMemeContentStore } from "../../store/useMemeContentStore.ts";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import DOMPurify from "dompurify";
import useWebSocketStore from "../../hooks/useWebSockets.ts";
import { getCurrentAuthUser } from "../../utils/authHelpers";

interface MemeCardProps {
  meme: Meme;
  activeOptionsId?: string | null;
  onOptionsClick?: (id: string | null) => void;
  activeTab?: string;
}

export const MemeCard: React.FC<MemeCardProps> = ({
  meme,
  activeOptionsId,
  onOptionsClick,
  activeTab,
}) => {
  const likedMemes = useMemeContentStore.use.likedMemes();
  const savedMemes = useMemeContentStore.use.savedMemes();
  const toggleLike = useMemeContentStore.use.toggleLike();
  const toggleSave = useMemeContentStore.use.toggleSave();
  const deleteMeme = useMemeContentStore.use.deleteMeme();
  const wsStore = useWebSocketStore();

  const navigate = useNavigate();
  const location = useLocation();
  const authUser = getCurrentAuthUser();
  const user = authUser ? { username: authUser.username, userId: authUser.userId } : {};
  const videoRef = useRef<HTMLVideoElement>(null);
  const usernameRef = useRef<HTMLSpanElement>(null);
  const usernameContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isScrollPaused, setIsScrollPaused] = useState(false);
  const [localIsLiked, setLocalIsLiked] = useState(false);
  const [localIsSaved, setLocalIsSaved] = useState(false);
  const isOptionsOpen = activeOptionsId === meme?.id;

  React.useEffect(() => {
    if (meme?.id && isOptionsOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest(`[data-meme-id="${meme.id}"]`)) {
          (onOptionsClick ?? (() => {}))(null);
        }
      };
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [meme?.id, isOptionsOpen, onOptionsClick]);

  useEffect(() => {
    const checkTextOverflow = () => {
      if (usernameRef.current && usernameContainerRef.current) {
        const textWidth = usernameRef.current.scrollWidth;
        const containerWidth = usernameContainerRef.current.clientWidth;
        setShouldScroll(textWidth > containerWidth + 5);
      }
    };

    const timer = setTimeout(checkTextOverflow, 100);

    window.addEventListener("resize", checkTextOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkTextOverflow);
    };
  }, [meme.uploader, isHovered]);

  useEffect(() => {
    if (meme && meme.id) {
      const storeIsLiked = likedMemes.some((m) => m.id === meme.id);
      const storeIsSaved = savedMemes.some((m) => m.id === meme.id);

      setLocalIsLiked(storeIsLiked);
      setLocalIsSaved(storeIsSaved);
    }
  }, [meme, likedMemes, savedMemes]);

  const memeUrl = meme.url || meme.mediaUrl || "";
  const sanitizeUrl = DOMPurify.sanitize(memeUrl ? encodeURI(memeUrl) : "");
  const isLiked = likedMemes.some((m) => m.id === meme.id) || localIsLiked;
  const isSaved = savedMemes.some((m) => m.id === meme.id) || localIsSaved;
  const pathSegments = location.pathname.split("/");
  const isProfilePage = pathSegments[1] === "profile";
  const profileUserId = pathSegments[2];
  const isOwnProfile = isProfilePage && profileUserId === user.username;
  const isVideo = memeUrl ? memeUrl.match(/\.(mp4|webm|ogg)$/i) : false;

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setIsHovered(true);
      } else if (!isVideo) {
        setIsHovered(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isVideo]);

  if (!meme || !meme.id) {
    return null;
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSave(meme.id, user.username);
    setLocalIsSaved(!isSaved);
    if (wsStore.isConnected) {
      wsStore.sendMessage({
        type: "SAVE",
        memeId: meme.id,
        action: isSaved ? "UNSAVE" : "SAVE",
        username: user.username,
      });
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalIsLiked(!isLiked);
    await toggleLike(meme.id, user.username);
    if (wsStore.isConnected) {
      wsStore.sendMessage({
        type: "LIKE",
        memeId: meme.id,
        action: isLiked ? "UNLIKE" : "LIKE",
        username: user.username,
      });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/meme/${meme.id}`
      );
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy");
    }
    (onOptionsClick ?? (() => {}))(null);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this meme?")) {
      try {
        await deleteMeme(meme.id);
        if (onOptionsClick) onOptionsClick(null);
        toast.success("Deleted!");
      } catch {
        toast.error("Failed to delete");
      }
    }
  };

  const navigateToMemeDetail = () => navigate(`/meme/${meme.id}`);
  const navigateToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${meme.uploader}`);
  };

  const isMobileDevice = () => {
    return window.innerWidth < 768;
  };

  const handleMouseEnter = () => {
    if (!isMobileDevice()) {
      setIsHovered(true);
      if (isVideo && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleMouseLeave = () => {
    if (!isMobileDevice()) {
      setIsHovered(false);
      if (isVideo && videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  };

  const handleUsernameMouseEnter = () => {
    setIsScrollPaused(true);
  };

  const handleUsernameMouseLeave = () => {
    setIsScrollPaused(false);
  };

  return (
    <div
      className="relative group cursor-pointer rounded-2xl lg:rounded-3xl overflow-hidden bg-white shadow-lg md:hover:shadow-2xl transition-all duration-300 md:hover:-translate-y-2 break-inside-avoid sm:mb-1 lg:mb-1 w-full inline-block border border-gray-100"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={navigateToMemeDetail}
    >
      <div className="relative">
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={sanitizeUrl}
              className="w-full h-auto object-cover block rounded-t-2xl lg:rounded-t-3xl"
              loop
              muted
              playsInline
            />
          </>
        ) : (
          <img
            src={memeUrl || "/placeholder.svg"}
            alt={meme.title || "Meme"}
            className="w-full h-auto object-cover block rounded-t-2xl lg:rounded-t-3xl"
          />
        )}

        <button
          onClick={handleSave}
          className={cn(
            "absolute top-4 right-4 px-5 py-2.5 rounded-full font-semibold transition-all duration-200 shadow-xl hidden md:block",
            "md:opacity-0 md:group-hover:opacity-100 transform md:translate-y-2 md:group-hover:translate-y-0"
          )}
          style={{
            backgroundColor: isSaved ? "#1f2937" : "#ffffff",
            color: isSaved ? "#ffffff" : "#000000",
          }}
        >
          {isSaved ? "Saved" : "Save"}
        </button>

        {isOwnProfile && activeTab === "uploaded" && (
          <div
            className="absolute top-2 left-2 lg:top-4 lg:left-4 transition-opacity duration-200"
            data-meme-id={meme.id}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOptionsClick) {
                  onOptionsClick(isOptionsOpen ? null : meme.id);
                }
              }}
              className="p-2 lg:p-3 bg-white/90 rounded-full hover:bg-white transition-colors shadow-xl"
            >
              <MoreVertical className="w-2 h-2 lg:w-5 lg:h-5 !text-black" />
            </button>

            {isOptionsOpen && (
              <div className="absolute left-0 top-full mt-1 lg:mt-2 w-32 lg:w-40 bg-white rounded-xl shadow-xl border py-1.5 z-50">
                <button
                  onClick={handleShare}
                  className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3"
                >
                  <Share className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleDelete}
                  className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 text-left text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3"
                >
                  <Trash className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 lg:p-5 transition-opacity duration-200",
            "md:opacity-0 md:group-hover:opacity-100 opacity-100"
          )}
        >
          <h3
            className="font-medium lg:font-semibold text-xs lg:text-base mb-2 lg:mb-4 line-clamp-2 leading-tight hidden md:block"
            style={{ color: "#ffffff" }}
          >
            {meme.title}
          </h3>
          <div className="flex items-center justify-between">
            <button
              onClick={navigateToProfile}
              className="flex items-center space-x-2 lg:space-x-3 hover:opacity-80 transition-opacity min-w-0 flex-1 mr-2"
              onMouseEnter={handleUsernameMouseEnter}
              onMouseLeave={handleUsernameMouseLeave}
            >
              {meme.profilePictureUrl ? (
                <img
                  src={meme.profilePictureUrl || "/placeholder.svg"}
                  alt={meme.uploader}
                  className="w-6 h-6 lg:w-10 lg:h-10 rounded-full object-cover border border-white/20 lg:border-2 flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 lg:w-10 lg:h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/20 lg:border-2 flex-shrink-0">
                  <User
                    className="w-3 h-3 lg:w-5 lg:h-5"
                    style={{ color: "#ffffff" }}
                  />
                </div>
              )}
              <div
                ref={usernameContainerRef}
                className="min-w-0 overflow-hidden relative"
              >
                <span
                  ref={usernameRef}
                  className={cn(
                    "text-xs lg:text-base font-medium whitespace-nowrap inline-block transition-transform duration-1000 ease-in-out",
                    shouldScroll && !isScrollPaused && "animate-scroll-text",
                    isScrollPaused && "animation-paused"
                  )}
                  style={{
                    color: "#ffffff",
                    animationDuration: shouldScroll
                      ? `${Math.max(3, meme.uploader.length * 0.2)}s`
                      : undefined,
                  }}
                >
                  {meme.uploader}
                </span>
                {shouldScroll && (
                  <>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/80 to-transparent pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/80 to-transparent pointer-events-none"></div>
                  </>
                )}
              </div>
            </button>
            <div className="hidden md:flex items-center space-x-1 lg:space-x-3 flex-shrink-0">
              <button
                onClick={handleLike}
                className="p-1.5 lg:p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <Heart
                  className={cn(
                    "w-3 h-3 lg:w-5 lg:h-5",
                    isLiked && "fill-red-500"
                  )}
                  style={{
                    color: "#ffffff",
                    fill: isLiked ? "#ef4444" : "none",
                  }}
                />
              </button>
              <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1 lg:px-3 lg:py-1.5">
                <MessageCircle
                  className="w-3 h-3 lg:w-4 lg:h-4"
                  style={{ color: "#ffffff" }}
                />
                <span
                  className="text-xs lg:text-sm font-medium"
                  style={{ color: "#ffffff" }}
                >
                  {meme.commentsCount || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scroll-text {
          0% {
            transform: translateX(0%);
          }
          25% {
            transform: translateX(0%);
          }
          75% {
            transform: translateX(calc(-100% + 100px));
          }
          100% {
            transform: translateX(calc(-100% + 100px));
          }
        }

        .animate-scroll-text {
          animation: scroll-text 5s linear infinite;
        }

        .animation-paused {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
