import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, LogOut } from 'lucide-react';
import { ThemeType } from '../store/useSettingsStore';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light Theme' },
  { value: 'dark', label: 'Dark Theme' },
];

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, isLoading, error, setTheme } = useSettings();
  const { logout } = useAuth();
  
  const [activeTheme, setActiveTheme] = useState<ThemeType>(theme);

  useEffect(() => {
    setActiveTheme(theme);
  }, [theme]);

  const handleThemeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ThemeType;
    setActiveTheme(value);
    await setTheme(value);
  };

  const handleThemeButtonClick = async (selectedTheme: ThemeType) => {
    setActiveTheme(selectedTheme);
    await setTheme(selectedTheme);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6 sticky top-0 z-10 py-2  px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">

        <button 
          onClick={() => navigate(-1)} 
          className="mr-3 p-2 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        {isLoading && (
          <Loader2 className="w-5 h-5 ml-3 animate-spin text-blue-500" />
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Appearance</h2>
        
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
          <div className="relative">
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              value={activeTheme}
              onChange={handleThemeChange}
              disabled={isLoading}
            >
              {THEME_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="block mb-3 font-medium text-gray-700 dark:text-gray-300">
            Choose Theme
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => handleThemeButtonClick('light')}
              disabled={isLoading}
              className={`flex-1 p-4 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTheme === 'light' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="bg-white border border-gray-200 rounded-md p-3 mb-2 shadow-sm">
                <div className="w-full h-2 bg-blue-500 rounded mb-2"></div>
                <div className="w-3/4 h-2 bg-gray-200 rounded mb-2"></div>
                <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
              </div>
              <p className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">Light</p>
              {isLoading && activeTheme === 'light' && (
                <div className="flex justify-center mt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
              )}
            </button>
            
            <button
              onClick={() => handleThemeButtonClick('dark')}
              disabled={isLoading}
              className={`flex-1 p-4 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTheme === 'dark' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="bg-gray-800 border border-gray-700 rounded-md p-3 mb-2 shadow-sm">
                <div className="w-full h-2 bg-blue-400 rounded mb-2"></div>
                <div className="w-3/4 h-2 bg-gray-600 rounded mb-2"></div>
                <div className="w-1/2 h-2 bg-gray-600 rounded"></div>
              </div>
              <p className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">Dark</p>
              {isLoading && activeTheme === 'dark' && (
                <div className="flex justify-center mt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="lg:hidden bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Other Settings</h2>
        
        {/* Logout button - only visible on mobile devices */}
        <div className="lg:hidden mb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center h-12 px-4 rounded-lg 
              !text-white bg-red-600 hover:bg-red-700 active:bg-red-800
              transition-all duration-200 ease-in-out transform 
              hover:scale-[1.02] active:scale-[0.98]
              hover:shadow-lg active:shadow-inner
              font-medium"
          >
            <LogOut className="w-5 h-5 mr-3 transition-transform duration-200" />
            <span className="text-sm">Log out</span>
          </button>
        </div>
        
        {/* <p className="text-gray-600 dark:text-gray-400">More settings will be available soon.</p> */}
      </div>
    </div>
  );
};

export default SettingsPage;