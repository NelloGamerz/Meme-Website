import { useCallback, useRef, useEffect } from 'react';

interface SmoothScrollOptions {
  duration?: number;
  easing?: (t: number) => number;
}
const easingFunctions = {
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutQuart: (t: number): number => 1 - (--t) * t * t * t,
  easeInOutQuint: (t: number): number => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
};

export const useSmoothScroll = () => {
  const animationRef = useRef<number>(0);

  const smoothScrollTo = useCallback((
    element: HTMLElement,
    targetPosition: number,
    options: SmoothScrollOptions = {}
  ) => {
    const { duration = 800, easing = easingFunctions.easeInOutCubic } = options;
    const startPosition = element.scrollTop;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      
      element.scrollTop = startPosition + distance * easedProgress;

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateScroll);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animateScroll);
  }, []);

  const smoothScrollToTop = useCallback((element: HTMLElement, options?: SmoothScrollOptions) => {
    smoothScrollTo(element, 0, options);
  }, [smoothScrollTo]);

  const smoothScrollToBottom = useCallback((element: HTMLElement, options?: SmoothScrollOptions) => {
    smoothScrollTo(element, element.scrollHeight - element.clientHeight, options);
  }, [smoothScrollTo]);

  const smoothScrollIntoView = useCallback((
    targetElement: HTMLElement,
    containerElement: HTMLElement,
    options?: SmoothScrollOptions
  ) => {
    const containerRect = containerElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    const targetPosition = containerElement.scrollTop + 
      (targetRect.top - containerRect.top) - 
      (containerRect.height - targetRect.height) / 2;

    smoothScrollTo(containerElement, targetPosition, options);
  }, [smoothScrollTo]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    smoothScrollTo,
    smoothScrollToTop,
    smoothScrollToBottom,
    smoothScrollIntoView,
    easingFunctions,
  };
};

export const useScrollPerformance = (elementRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.style.willChange = 'scroll-position';
    element.style.transform = 'translateZ(0)';
    element.style.backfaceVisibility = 'hidden';

    const handleScroll = () => {
      requestAnimationFrame(() => {
      });
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      element.style.willChange = 'auto';
      element.style.transform = '';
      element.style.backfaceVisibility = '';
    };
  }, [elementRef]);
};

export const useMomentumScroll = (elementRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    (element.style as any)['webkitOverflowScrolling'] = 'touch';
    element.style.overscrollBehavior = 'contain';

    return () => {
      (element.style as any)['webkitOverflowScrolling'] = '';
      element.style.overscrollBehavior = '';
    };
  }, [elementRef]);
};