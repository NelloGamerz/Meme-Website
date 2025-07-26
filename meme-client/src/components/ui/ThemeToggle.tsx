import React from 'react';
import { Sun, Moon, Loader2 } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = false,
  size = 'md'
}) => {
  const { theme, isLoading, toggleTheme } = useSettings();

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleToggle = () => {
    if (!isLoading) {
      toggleTheme();
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        rounded-full 
        transition-all 
        duration-200 
        bg-gray-100 
        dark:bg-gray-800 
        hover:bg-gray-200 
        dark:hover:bg-gray-700 
        text-gray-700 
        dark:text-gray-300
        disabled:opacity-50 
        disabled:cursor-not-allowed
        focus:outline-none 
        focus:ring-2 
        focus:ring-blue-500 
        focus:ring-offset-2
        ${showLabel ? 'flex items-center space-x-2' : ''}
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : theme === 'light' ? (
        <Moon className={iconSizes[size]} />
      ) : (
        <Sun className={iconSizes[size]} />
      )}
      
      {showLabel && (
        <span className="text-sm font-medium">
          {isLoading ? 'Updating...' : theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;