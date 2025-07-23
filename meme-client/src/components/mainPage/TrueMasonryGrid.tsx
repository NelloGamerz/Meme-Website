import React from "react"
import Masonry from "react-masonry-css"

interface TrueMasonryGridProps {
  children: React.ReactNode
  className?: string
  breakpointCols?: number | { [key: number]: number }
  columnClassName?: string
}

export const TrueMasonryGrid: React.FC<TrueMasonryGridProps> = ({ 
  children, 
  className = "",
  breakpointCols = {
    default: 3,
    1400: 3,
    1100: 2,
    700: 2,
    500: 2
  },
  columnClassName = ""
}) => {
  const defaultColumnClassName = `
    masonry-grid_column
    ${columnClassName}
  `.trim()

  return (
    <div className={`w-full ${className}`}>
      <Masonry
        breakpointCols={breakpointCols}
        className="masonry-grid flex"
        columnClassName={defaultColumnClassName}
      >
        {children}
      </Masonry>
      <style>{`
        .masonry-grid {
          display: flex;
          width: auto;
        }
        .masonry-grid_column {
          padding: 0px; /* Remove all padding for mobile */
          background-clip: padding-box;
        }
        .masonry-grid_column > * {
          break-inside: avoid;
          margin-bottom: 0px;
        }
        
        /* Add padding only on desktop */
        @media (min-width: 1024px) {
          .masonry-grid_column {
            padding: 0.2rem;
          }
        }
      `}</style>
    </div>
  )
}