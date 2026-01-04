import type React from "react";
import { useCallback, memo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNavigation } from "./BottomNavigation";
// import { ConnectionStatus } from "../ui/ConnectionStatus";
import { useSettings } from "../../hooks/useSettings";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useBackgroundSync } from "../../hooks/useBackgroundSync";
import { useChatStore } from "../../store/useChatStore";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = memo(({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { theme } = useSettings();
  const { isAuthenticated } = useAuthContext();
  
  useBackgroundSync();

  const isMemeDetailPage = pathname.startsWith('/meme/');
  const isMessagingPage = pathname === '/messages';
  const isMobileChatOpen = useChatStore((s) => s.isMobileChatOpen);
  
  const showNavigation = isAuthenticated || !isMemeDetailPage;

  const handleNavigation = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;

      root.classList.remove("light", "dark", "system");
      root.classList.add(theme);
    };

    applyTheme();

    const handleStorageChange = () => {
      applyTheme();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [theme]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200 overflow-hidden">
      {showNavigation && (
        <Sidebar 
          onNavigate={handleNavigation} 
          currentPath={pathname} 
          isMessagingMode={isMessagingPage}
        />
      )}

      <main className={`flex-1 transition-all duration-300 ease-in-out ${
        showNavigation 
          ? isMessagingPage 
            ? 'lg:ml-16 pb-14 lg:pb-0' // Reduced margin for messaging mode
            : 'lg:ml-60 pb-14 lg:pb-0' // Normal margin for other pages
          : ''
      } flex flex-col overflow-hidden`}>
        <div className={`h-full ${!isMessagingPage ? 'overflow-auto scrollbar-hide ultra-smooth-scroll custom-scrollbar' : ''}`}>
          {children}
        </div>
      </main>

      {showNavigation && (
        <div className={`${isMessagingPage && isMobileChatOpen ? 'hidden' : 'lg:hidden'} fixed bottom-0 left-0 right-0 z-40`}>
          <BottomNavigation onNavigate={handleNavigation} currentPath={pathname} />
        </div>
      )}

      {/* <ConnectionStatus /> */}
    </div>
  );
});