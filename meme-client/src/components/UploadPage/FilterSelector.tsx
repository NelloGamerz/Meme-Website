import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Check,
  X,
  FilterIcon,
  Loader2,
} from "lucide-react";
import { createPortal } from "react-dom";

export interface Filter {
  id: string;
  name: string;
  cssFilter: string;
  intensity?: number;
}

interface FilterSelectorProps {
  previewUrl: string;
  selectedFilter: Filter | null;
  onFilterSelect: (filter: Filter | null) => void;
}

const filters: Filter[] = [

  { id: "none", name: "Original", cssFilter: "none" },
  {
    id: "4k-enhance",
    name: "4K Enhance",
    cssFilter:
      "contrast(1.3) brightness(1.05) saturate(1.2) blur(0px) sepia(0.05)",
  },
  {
    id: "8k-ultra",
    name: "8K Ultra",
    cssFilter:
      "contrast(1.4) brightness(1.08) saturate(1.3) blur(0px) hue-rotate(2deg)",
  },
  {
    id: "hdr-pro",
    name: "HDR Pro",
    cssFilter: "contrast(1.5) brightness(0.95) saturate(1.4) blur(0px)",
  },
  {
    id: "ultra-sharp",
    name: "Ultra Sharp",
    cssFilter:
      "contrast(1.6) brightness(1.02) saturate(1.1) blur(0px) sepia(0.02)",
  },
  {
    id: "crystal-clear",
    name: "Crystal",
    cssFilter:
      "contrast(1.35) brightness(1.1) saturate(1.25) blur(0px) hue-rotate(5deg)",
  },
  {
    id: "clarendon",
    name: "Clarendon",
    cssFilter: "contrast(1.2) saturate(1.35) brightness(1.1)",
  },
  {
    id: "gingham",
    name: "Gingham",
    cssFilter: "brightness(1.05) hue-rotate(-10deg)",
  },
  {
    id: "moon",
    name: "Moon",
    cssFilter: "grayscale(1) contrast(1.1) brightness(1.1)",
  },
  {
    id: "lark",
    name: "Lark",
    cssFilter: "contrast(0.9) brightness(1.1) saturate(1.2)",
  },
  {
    id: "reyes",
    name: "Reyes",
    cssFilter: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)",
  },
  {
    id: "juno",
    name: "Juno",
    cssFilter: "sepia(0.35) contrast(1.15) brightness(1.15) saturate(1.8)",
  },
  {
    id: "slumber",
    name: "Slumber",
    cssFilter: "saturate(0.66) brightness(1.05)",
  },
  {
    id: "crema",
    name: "Crema",
    cssFilter:
      "sepia(0.5) contrast(1.25) brightness(1.15) saturate(0.9) hue-rotate(-2deg)",
  },
  {
    id: "ludwig",
    name: "Ludwig",
    cssFilter: "sepia(0.25) contrast(1.05) brightness(1.05) saturate(2)",
  },
  {
    id: "aden",
    name: "Aden",
    cssFilter:
      "hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)",
  },
  {
    id: "perpetua",
    name: "Perpetua",
    cssFilter: "contrast(1.05) brightness(1.05) saturate(1.1) sepia(0.1)",
  },
  {
    id: "vsco-a6",
    name: "VSCO A6",
    cssFilter: "sepia(0.3) saturate(1.2) contrast(1.1) brightness(1.1)",
  },
  {
    id: "vsco-c1",
    name: "VSCO C1",
    cssFilter: "sepia(0.5) saturate(0.8) contrast(1.2) brightness(1.05)",
  },
  {
    id: "vsco-f2",
    name: "VSCO F2",
    cssFilter: "sepia(0.4) saturate(1.4) contrast(0.95) brightness(1.15)",
  },
  {
    id: "tiktok-glow",
    name: "TikTok Glow",
    cssFilter: "brightness(1.2) contrast(1.1) saturate(1.3) blur(0.3px)",
  },
  {
    id: "snapchat-pop",
    name: "Snap Pop",
    cssFilter: "saturate(1.8) contrast(1.2) brightness(1.1) hue-rotate(10deg)",
  },
  {
    id: "vintage",
    name: "Vintage",
    cssFilter: "sepia(0.8) contrast(1.2) brightness(1.1)",
  },
  {
    id: "retro",
    name: "Retro",
    cssFilter: "sepia(0.4) hue-rotate(320deg) saturate(1.5)",
  },
  {
    id: "film-grain",
    name: "Film Grain",
    cssFilter: "sepia(0.35) contrast(1.15) brightness(0.95) saturate(1.1)",
  },
  {
    id: "polaroid",
    name: "Polaroid",
    cssFilter: "sepia(0.4) contrast(1.3) brightness(1.2) saturate(0.9)",
  },
  {
    id: "70s-vibe",
    name: "70s Vibe",
    cssFilter: "sepia(0.6) hue-rotate(15deg) saturate(1.4) contrast(1.1)",
  },
  { id: "bw", name: "B&W", cssFilter: "grayscale(1) contrast(1.1)" },
  {
    id: "noir",
    name: "Noir",
    cssFilter: "grayscale(1) contrast(1.8) brightness(0.8)",
  },
  {
    id: "dramatic-bw",
    name: "Drama B&W",
    cssFilter: "grayscale(1) contrast(2) brightness(0.9)",
  },
  {
    id: "soft-bw",
    name: "Soft B&W",
    cssFilter: "grayscale(1) contrast(0.9) brightness(1.1)",
  },
  {
    id: "warm",
    name: "Warm",
    cssFilter: "hue-rotate(15deg) saturate(1.3) brightness(1.1)",
  },
  {
    id: "cool",
    name: "Cool",
    cssFilter: "hue-rotate(-15deg) saturate(1.2) brightness(0.95)",
  },
  {
    id: "vibrant",
    name: "Vibrant",
    cssFilter: "saturate(1.8) contrast(1.2) brightness(1.05)",
  },
  {
    id: "pastel",
    name: "Pastel",
    cssFilter: "saturate(0.6) brightness(1.3) contrast(0.8)",
  },
  {
    id: "neon",
    name: "Neon",
    cssFilter: "saturate(2) hue-rotate(90deg) contrast(1.3)",
  },
  {
    id: "sunset",
    name: "Sunset",
    cssFilter: "sepia(0.3) hue-rotate(350deg) saturate(1.4) brightness(1.1)",
  },
  {
    id: "golden",
    name: "Golden",
    cssFilter: "sepia(0.5) hue-rotate(30deg) saturate(1.3) brightness(1.2)",
  },
  {
    id: "arctic",
    name: "Arctic",
    cssFilter: "hue-rotate(180deg) saturate(0.8) brightness(1.2)",
  },
  {
    id: "ocean",
    name: "Ocean",
    cssFilter: "hue-rotate(200deg) saturate(1.3) brightness(1.1) contrast(1.1)",
  },
  {
    id: "forest",
    name: "Forest",
    cssFilter: "hue-rotate(90deg) saturate(1.2) brightness(0.95) contrast(1.1)",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    cssFilter: "hue-rotate(300deg) saturate(2) contrast(1.4) brightness(0.9)",
  },
  {
    id: "purple",
    name: "Purple",
    cssFilter: "hue-rotate(270deg) saturate(1.5) contrast(1.1)",
  },
  {
    id: "emerald",
    name: "Emerald",
    cssFilter: "hue-rotate(120deg) saturate(1.4) contrast(1.2)",
  },
  {
    id: "fade",
    name: "Fade",
    cssFilter: "brightness(1.2) contrast(0.8) saturate(0.8)",
  },
  {
    id: "soft",
    name: "Soft",
    cssFilter: "blur(0.5px) brightness(1.1) contrast(0.9)",
  },
  {
    id: "dramatic",
    name: "Dramatic",
    cssFilter: "contrast(1.5) brightness(0.9) saturate(1.4)",
  },
];

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  previewUrl,
  selectedFilter,
  onFilterSelect,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalHeaderRef = useRef<HTMLDivElement>(null);
  const isSwipingHeader = useRef<boolean>(false);

  const triggerHapticFeedback = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsImageLoading(false);
    setImageError(true);
  }, []);

  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = Math.min(200, container.clientWidth * 0.8);
      container.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = Math.min(200, container.clientWidth * 0.8);
      container.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchEndY(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const horizontalDistance = touchStart - touchEnd;
    const isLeftSwipe = horizontalDistance > 50;
    const isRightSwipe = horizontalDistance < -50;

    if (isLeftSwipe || isRightSwipe) {
      triggerHapticFeedback();
      if (isLeftSwipe) scrollRight();
      if (isRightSwipe) scrollLeft();
    }
  }, [touchStart, touchEnd, scrollLeft, scrollRight, triggerHapticFeedback]);

  const handleModalTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartY) return;

      const currentY = e.targetTouches[0].clientY;
      setTouchEndY(currentY);

      if (
        isSwipingHeader.current &&
        modalRef.current &&
        currentY > touchStartY
      ) {
        const translateY = currentY - touchStartY;
        modalRef.current.style.transform = `translateY(${translateY}px)`;
        modalRef.current.style.transition = "none";

        e.preventDefault();
      }
    },
    [touchStartY]
  );

  const handleModalTouchEnd = useCallback(() => {
    if (!touchStartY || !touchEndY || !modalRef.current) return;

    if (isSwipingHeader.current) {
      const verticalDistance = touchEndY - touchStartY;
      const isSwipeDown = verticalDistance > 80;

      if (modalRef.current) {
        modalRef.current.style.transition =
          "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
      }

      if (isSwipeDown) {
        triggerHapticFeedback();
        if (modalRef.current) {
          modalRef.current.style.transform = "translateY(100%)";
        }
        setTimeout(() => setIsModalOpen(false), 300);
      } else {
        if (modalRef.current) {
          modalRef.current.style.transform = "translateY(0)";
        }
      }
    }

    isSwipingHeader.current = false;
  }, [touchStartY, touchEndY, triggerHapticFeedback]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollLeft();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollRight();
      } else if (e.key === "Escape" && isModalOpen && modalRef.current) {
        modalRef.current.style.transform = "translateY(100%)";
        setTimeout(() => setIsModalOpen(false), 300);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, scrollLeft, scrollRight]);

  const handleModalBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && modalRef.current) {
      modalRef.current.style.transform = "translateY(100%)";
      setTimeout(() => setIsModalOpen(false), 300);
    }
  }, []);

  const handleFilterSelect = useCallback(
    (filter: Filter | null, fromModal = false) => {
      triggerHapticFeedback();
      onFilterSelect(filter);
      if (fromModal) {
        setIsModalOpen(false);
      }
    },
    [onFilterSelect, triggerHapticFeedback]
  );

  const renderFilterThumbnail = useCallback(
    (filter: Filter, isInModal = false) => {
      const isSelected =
        selectedFilter?.id === filter.id ||
        (!selectedFilter && filter.id === "none");

      return (
        <button
          key={filter.id}
          onClick={() =>
            handleFilterSelect(filter.id === "none" ? null : filter, isInModal)
          }
          className={`relative group transition-all duration-300 ease-out flex-shrink-0 touch-manipulation ${
            !isInModal ? "snap-start" : ""
          } ${
            isSelected
              ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-105 shadow-lg"
              : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-gray-900 active:scale-95 hover:shadow-md"
          } w-20 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden p-0 m-0`}
          style={{
            transform: isSelected ? "scale(1.05)" : "scale(1)",
          }}
        >
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-sm">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
            <img
              src={previewUrl || "/placeholder.svg?height=100&width=100"}
              alt={filter.name}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
                isImageLoading ? "opacity-0" : "opacity-100"
              }`}
              style={{ filter: filter.cssFilter }}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-white text-xs">
                No Image
              </div>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-white text-[10px] sm:text-xs py-1.5 text-center rounded-b-xl">
            <span className="block !text-white truncate font-medium drop-shadow-sm">
              {filter.name}
            </span>
          </div>

          {isSelected && (
            <div className="absolute top-[2px] right-[4px] bg-blue-500 text-white rounded-full p-[2px] shadow-md ring-1 ring-white dark:ring-gray-900">
              <Check className="w-[9px] h-[9px]" />
            </div>
          )}
        </button>
      );
    },
    [
      selectedFilter,
      previewUrl,
      isImageLoading,
      imageError,
      handleFilterSelect,
      handleImageLoad,
      handleImageError,
    ]
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3 sm:space-y-4 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
          Choose a Filter
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleFilterSelect(null)}
            className="text-sm text-blue-600 dark:text-blue-500 font-medium transition-colors"
          >
            Reset to Original
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="sm:hidden flex items-center gap-2 bg-blue-500 active:bg-blue-700 !text-white text-sm rounded-full px-4 py-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            <FilterIcon className="w-4 h-4" />
            <span>All Filters</span>
          </button>
        </div>
      </div>

      <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-80 xl:h-96 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-lg">
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}
        <img
          src={previewUrl || "/placeholder.svg?height=400&width=600"}
          alt="Preview with filter"
          className={`w-full h-full object-contain transition-all duration-500 ${
            isImageLoading ? "opacity-0" : "opacity-100"
          }`}
          style={{
            filter: selectedFilter?.cssFilter || "none",
            objectPosition: "center",
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">🖼️</div>
              <div className="text-sm">Image not available</div>
            </div>
          </div>
        )}

        {selectedFilter && (
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm !text-white px-3 py-1.5 rounded-full text-sm font-medium">
            {selectedFilter.name}
          </div>
        )}
      </div>

      <div className="relative hidden sm:block">
        <h4 className="pb-4 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
          <span>Filters ({filters.length} available)</span>
        </h4>

        <div
          ref={scrollContainerRef}
          className="p-4 h-32 flex gap-3 overflow-x-auto custom-scrollbar snap-mandatory scroll-smooth"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {filters.map((filter) => renderFilterThumbnail(filter))}
        </div>
      </div>

      <div className="sm:hidden flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-sm">
            <img
              src={previewUrl || "/placeholder.svg?height=40&width=40"}
              alt={selectedFilter?.name || "Original"}
              className="w-full h-full object-cover"
              style={{ filter: selectedFilter?.cssFilter || "none" }}
            />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedFilter?.name || "Original"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Current filter
            </div>
          </div>
        </div>
      </div>
      {isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 backdrop-blur-sm bg-white/10 dark:bg-black/20 flex flex-col justify-end"
            onClick={handleModalBackdropClick}
          >
            <div
              ref={modalRef}
              className={`
          bg-white dark:bg-gray-900 rounded-t-3xl w-full max-h-[85dvh]
          overflow-hidden flex flex-col shadow-lg transform transition-transform duration-300
          ${isModalOpen ? "translate-y-0" : "translate-y-full"}
        `}
              style={{
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchMove={handleModalTouchMove}
              onTouchEnd={handleModalTouchEnd}
            >
              <div
                ref={modalHeaderRef}
                className="flex flex-col items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky top-0 z-10"
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Select a Filter
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {filters.length} filters available
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-full  hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div
                className="p-4 overflow-y-auto flex-grow"
                onTouchStart={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-3 gap-4">
                  {filters.map((filter) => renderFilterThumbnail(filter, true))}
                </div>
                <div className="h-4"></div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky bottom-0 z-10">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.getElementById("modal-root")!
        )}
    </div>
  );
};

export default FilterSelector;
