import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const AnimatedMemeVault: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#6366f1'
    }}>
      <div style={{
        display: 'flex',
        gap: '0.1em'
      }}>
        {['M', 'e', 'm', 'e', 'V', 'a', 'u', 'l', 't'].map((letter, index) => (
          <span
            key={index}
            style={{
              animation: `bounce 1.5s infinite ${index * 0.1}s`,
              display: 'inline-block'
            }}
          >
            {letter}
          </span>
        ))}
      </div>
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
        `}
      </style>
    </div>
  );
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading || isAuthenticated === null) return <AnimatedMemeVault />;

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
