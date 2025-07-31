import React from 'react';
import { useSettings } from '../../hooks/useSettings';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Theme toggle component that demonstrates the new IndexedDB + backend sync functionality
 * Flow: User clicks → Backend call → Success → Save to IndexedDB → Update UI
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = "", 
  showLabel = true 
}) => {
  const { theme, setTheme, isLoading, error } = useSettings();

  const handleToggle = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';    
    try {
      await setTheme(newTheme);
    } catch (error) {
      console.error('❌ Failed to change theme:', error);
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme:
        </span>
      )}
      
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>

      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
          {theme}
        </span>
      )}

      {isLoading && (
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500">Syncing...</span>
        </div>
      )}

      {error && (
        <span className="text-xs text-red-500" title={error}>
          ⚠️
        </span>
      )}
    </div>
  );
};