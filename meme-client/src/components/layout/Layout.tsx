import type React from "react";
import { useCallback, memo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNavigation } from "./BottomNavigation";
// import { ConnectionStatus } from "../ui/ConnectionStatus";
import { useSettings } from "../../hooks/useSettings";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useBackgroundSync } from "../../hooks/useBackgroundSync";

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
        <Sidebar onNavigate={handleNavigation} currentPath={pathname} />
      )}

      <main className={`flex-1 ${showNavigation ? 'lg:ml-60 pb-14 lg:pb-0' : ''} flex flex-col overflow-hidden`}>
        <div className="h-full overflow-auto scrollbar-hide ultra-smooth-scroll">
          {children}
        </div>
      </main>

      {showNavigation && (
        <BottomNavigation onNavigate={handleNavigation} currentPath={pathname} />
      )}

      {/* <ConnectionStatus /> */}
    </div>
  );
});