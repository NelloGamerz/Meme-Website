import { useState, useCallback } from 'react';

/**
 * Hook to force component re-renders when needed
 */
export const useForceUpdate = () => {
  const [, setTick] = useState(0);
  
  const forceUpdate = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  
  return forceUpdate;
};

export default useForceUpdate;