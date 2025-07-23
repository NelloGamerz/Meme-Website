import React, { forwardRef, useEffect, useRef } from 'react';
import { useScrollPerformance, useMomentumScroll } from '../hooks/useSmoothScroll';

interface SmoothScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  enableGPUAcceleration?: boolean;
  enableMomentumScrolling?: boolean;
  enableScrollSnap?: boolean;
  className?: string;
}

export const SmoothScrollContainer = forwardRef<HTMLDivElement, SmoothScrollContainerProps>(
  ({ 
    children, 
    enableGPUAcceleration = true, 
    enableMomentumScrolling = true,
    enableScrollSnap = false,
    className = '',
    ...props 
  }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const scrollRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;

    useScrollPerformance(scrollRef);
    
    if (enableMomentumScrolling) {
      useMomentumScroll(scrollRef);
    }

    const scrollClasses = [
      'ultra-smooth-scroll',
      enableGPUAcceleration && 'gpu-accelerated',
      enableScrollSnap && 'scroll-snap-y-proximity',
      className
    ].filter(Boolean).join(' ');

    return (
      <div
        ref={scrollRef}
        className={scrollClasses}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SmoothScrollContainer.displayName = 'SmoothScrollContainer';

export const withSmoothScroll = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  options: Partial<SmoothScrollContainerProps> = {}
) => {
  const WrappedComponent = React.forwardRef<HTMLDivElement, P>((props, ref) => (
    <SmoothScrollContainer ref={ref} {...options}>
      <Component {...(props as P)} />
    </SmoothScrollContainer>
  )) as React.ForwardRefExoticComponent<P & React.RefAttributes<HTMLDivElement>>;

  WrappedComponent.displayName = `withSmoothScroll(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export const ScrollToTopButton: React.FC<{
  containerRef: React.RefObject<HTMLElement>;
  className?: string;
  showThreshold?: number;
}> = ({ containerRef, className = '', showThreshold = 300 }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsVisible(container.scrollTop > showThreshold);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, showThreshold]);

  const scrollToTop = () => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-20 right-4 z-50 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${className}`}
      aria-label="Scroll to top"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
};