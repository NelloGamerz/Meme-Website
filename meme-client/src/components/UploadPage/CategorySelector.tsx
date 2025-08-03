import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

export interface MemeCategory {
  id: string
  name: string
}

interface CategorySelectorProps {
  selectedCategory: MemeCategory | null
  onCategorySelect: (category: MemeCategory) => void
}

const categories: MemeCategory[] = [
  { id: "comedy", name: "Comedy" },
  { id: "dark", name: "Dark Humor" },
  { id: "it", name: "Tech/IT" },
  { id: "wholesome", name: "Wholesome" },
  { id: "trending", name: "Trending" },
  { id: "random", name: "Random" },
  { id: "music", name: "Music" },
  { id: "gaming", name: "Gaming" },
  { id: "sports", name: "Sports" },
  { id: "meme", name: "Classic Meme" },
  { id: "politics", name: "Politics" },
  { id: "animals", name: "Animals" },
]

export const CategorySelector: React.FC<CategorySelectorProps> = ({ selectedCategory, onCategorySelect }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isMobile, setIsMobile] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartY = useRef<number>(0)
  const lastTouchY = useRef<number>(0)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault()
          setHighlightedIndex((prev) => (prev < categories.length - 1 ? prev + 1 : 0))
          break
        case "ArrowUp":
          event.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : categories.length - 1))
          break
        case "Enter":
          event.preventDefault()
          if (highlightedIndex >= 0) {
            onCategorySelect(categories[highlightedIndex])
            setIsOpen(false)
            setHighlightedIndex(-1)
          }
          break
        case "Escape":
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, highlightedIndex, onCategorySelect])

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        })
      }
    }
  }, [highlightedIndex])

  const handleWheel = (event: React.WheelEvent) => {
    if (!isOpen || isMobile) return

    event.preventDefault()
    event.stopPropagation()

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const delta = event.deltaY > 0 ? 1 : -1

      setHighlightedIndex((prev) => {
        let newIndex = prev + delta

        if (newIndex < 0) {
          newIndex = categories.length - 1
        } else if (newIndex >= categories.length) {
          newIndex = 0
        }

        return newIndex
      })
    }, 50)
  }

  const handleTouchStart = (event: React.TouchEvent) => {
    if (!isMobile) return
    touchStartY.current = event.touches[0].clientY
    lastTouchY.current = event.touches[0].clientY
  }

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isMobile || !isOpen) return

    const currentY = event.touches[0].clientY
    const deltaY = lastTouchY.current - currentY
    lastTouchY.current = currentY

    if (Math.abs(deltaY) > 10) {
      event.preventDefault()

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const delta = deltaY > 0 ? 1 : -1

        setHighlightedIndex((prev) => {
          let newIndex = prev + delta

          if (newIndex < 0) {
            newIndex = categories.length - 1
          } else if (newIndex >= categories.length) {
            newIndex = 0
          }

          return newIndex
        })
      }, 100)
    }
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!isMobile) return

    const endY = event.changedTouches[0].clientY
    const totalDelta = touchStartY.current - endY

    if (Math.abs(totalDelta) < 10 && highlightedIndex >= 0) {
      onCategorySelect(categories[highlightedIndex])
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }

  const handleCategorySelect = (category: MemeCategory) => {
    onCategorySelect(category)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-2">
      <label htmlFor="category" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
        Category <span className="text-red-500">*</span>
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white bg-white text-left transition-all duration-200 flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 touch-manipulation text-sm sm:text-base"
        >
          <span
            className={`truncate pr-2 ${selectedCategory ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
          >
            {selectedCategory ? selectedCategory.name : "Select a category"}
          </span>
          <ChevronDown
            className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <>
            {isMobile && <div className="fixed inset-0 backdrop-blur-sm bg-white/10 dark:bg-black/20 z-40 sm:hidden" onClick={() => setIsOpen(false)} />}

            <div
              className={`absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl shadow-lg ${
                isMobile ? "max-h-[50vh]" : "max-h-60"
              } overflow-hidden`}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                ref={listRef}
                className={`overflow-y-auto ${isMobile ? "max-h-[50vh]" : "max-h-60"} py-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent ${
                  isMobile ? "overscroll-contain" : ""
                }`}
                style={{
                  scrollBehavior: "smooth",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150 touch-manipulation text-sm sm:text-base ${
                      selectedCategory?.id === category.id
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium"
                        : "text-gray-900 dark:text-white"
                    } ${index === highlightedIndex ? "bg-gray-100 dark:bg-gray-600" : ""}`}
                    onMouseEnter={() => !isMobile && setHighlightedIndex(index)}
                    onMouseLeave={() => !isMobile && setHighlightedIndex(-1)}
                  >
                    <span className="block truncate">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {isOpen && (
        <div className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400 mt-1">
          {isMobile ? "Swipe up/down to navigate • Tap to select" : "Use scroll wheel or arrow keys to navigate"}
        </div>
      )}
    </div>
  )
}

export default CategorySelector
