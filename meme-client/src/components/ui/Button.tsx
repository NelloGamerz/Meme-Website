import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: typeof LucideIcon;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'default',
  icon: Icon,
  isLoading,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-lg transition-colors flex items-center justify-center font-semibold disabled:opacity-50';
  const variants = {
    primary: 'bg-blue-600 text-[#ffffff]',
    secondary: 'bg-gray-700 text-[#ffffff]',
    ghost: 'bg-transparent text-gray-300 hover:bg-gray-700 border border-gray-600',
    outline: 'border border-blue-500 text-black',
  };

  const sizes = {
    default: 'py-3 px-4 space-x-2',
    sm: 'py-2 px-3 text-sm space-x-1.5',
    lg: 'py-4 px-6 text-lg space-x-3',
    icon: 'p-2 aspect-square',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        <>
          {Icon && <Icon className="h-5 w-5" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};