import React, { useState, useEffect } from 'react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'auto';
  showZoom?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'auto',
  showZoom = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  
  useEffect(() => {
    if (isZoomed) {
      const scrollY = window.scrollY;
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          toggleZoom();
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        window.scrollTo(0, scrollY);
        
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isZoomed]);
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  const handleImageError = () => {
    setIsLoading(false);
    setError(true);
  };
  
  const toggleZoom = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (showZoom) {
      setIsZoomed(!isZoomed);
    }
  };
  
  return (
    <div className={`rounded-lg overflow-hidden ${isZoomed ? '' : ''}`}>
      {isLoading && (
        <div className="flex items-center justify-center bg-gray-100" style={{
          height: aspectRatio === 'square' ? '100%' : '300px',
          aspectRatio: aspectRatio === 'square' ? '1/1' : 'auto'
        }}>
          <svg className="w-10 h-10 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {error && (
        <div className="flex items-center justify-center bg-red-50 text-red-500" style={{
          height: aspectRatio === 'square' ? '100%' : '300px',
          aspectRatio: aspectRatio === 'square' ? '1/1' : 'auto'
        }}>
          <div className="text-center">
            <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="mt-2">Failed to load image</p>
          </div>
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className={`w-full h-auto object-contain transition-all duration-300 ${
          aspectRatio === 'square' ? 'aspect-square' : 'max-h-96'
        } ${className} ${isLoading ? 'opacity-0' : 'opacity-100'} ${
          showZoom ? 'cursor-pointer hover:opacity-95' : ''
        } ${isZoomed ? 'max-h-[90vh] max-w-[90vw] object-contain' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        onClick={toggleZoom}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
      
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 backdrop-blur-sm bg-white/10 dark:bg-black/20 flex items-center justify-center p-4"
          onClick={toggleZoom}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
            <button 
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 transition-all duration-200 transform hover:scale-110"
              onClick={toggleZoom}
              aria-label="Close preview"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};