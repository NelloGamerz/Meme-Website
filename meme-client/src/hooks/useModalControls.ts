import { useEffect } from 'react';
export const useModalControls = (
  isOpen: boolean, 
  onClose: () => void, 
  options: { disableEscapeKey?: boolean } = {}
) => {
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen || options.disableEscapeKey) return;
    
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose, options.disableEscapeKey]);
};