import type React from "react"

interface SkeletonCardProps {
  index?: number
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ index = 0 }) => {
  const heights = ["h-48", "h-56", "h-64", "h-72", "h-80", "h-60", "h-52", "h-68", "h-44", "h-76"]
  const randomHeight = heights[index % heights.length]

  return (
    <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden bg-white shadow-lg break-inside-avoid mb-6 lg:mb-8 w-full inline-block border border-gray-100 animate-pulse">
      <div className="relative">
        <div
          className={`w-full ${randomHeight} bg-gradient-to-br from-gray-200 via-gray-250 to-gray-300 rounded-t-2xl lg:rounded-t-3xl`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-gray-300/20 to-transparent"></div>
        </div>

        <div className="absolute top-2 right-2 lg:top-4 lg:right-4 w-14 lg:w-20 h-5 lg:h-8 bg-gray-300/80 rounded-full"></div>


        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-3 lg:p-5">

          <div className="mb-2 lg:mb-4 space-y-1.5">
            <div className="h-2.5 lg:h-4 bg-white/40 rounded" style={{ width: `${60 + ((index * 7) % 30)}%` }}></div>
            <div className="h-2.5 lg:h-4 bg-white/30 rounded" style={{ width: `${40 + ((index * 5) % 25)}%` }}></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 lg:space-x-3 flex-1 min-w-0">
              <div className="w-6 h-6 lg:w-10 lg:h-10 bg-white/40 rounded-full flex-shrink-0"></div>
              <div className="h-2.5 lg:h-4 bg-white/40 rounded" style={{ width: `${50 + ((index * 3) % 40)}px` }}></div>
            </div>

            <div className="flex items-center space-x-1 lg:space-x-3 flex-shrink-0">
              <div className="w-6 h-6 lg:w-9 lg:h-9 bg-white/40 rounded-full"></div>
              <div className="w-10 lg:w-16 h-5 lg:h-7 bg-white/40 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
