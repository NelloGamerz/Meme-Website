import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light Theme' },
  { value: 'dark', label: 'Dark Theme' },
];

export const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>(theme);
  const navigate = useNavigate();
  
  const applyThemeDirectly = (themeValue: 'light' | 'dark') => {
    const root = document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(themeValue);
    
    document.body.classList.add('theme-changing');
    setTimeout(() => {
      document.body.classList.remove('theme-changing');
    }, 10);
  };

  useEffect(() => {
    setActiveTheme(theme);
    
    applyThemeDirectly(theme);
  }, [theme]);
  
  useEffect(() => {
    applyThemeDirectly(theme);
    
    const timeoutId = setTimeout(() => {
      applyThemeDirectly(theme);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'light' | 'dark';
    
    setActiveTheme(value);
    
    applyThemeDirectly(value);
    
    try {
      localStorage.setItem('theme', value);
    } catch (error) {
    }
    
    setTheme(value);
    
    window.dispatchEvent(new Event('storage'));
  };

  const handleThemeButtonClick = (selectedTheme: 'light' | 'dark') => {
    setActiveTheme(selectedTheme);
    
    applyThemeDirectly(selectedTheme);
    
    try {
      localStorage.setItem('theme', selectedTheme);
    } catch (error) {
    }
    
    setTheme(selectedTheme);
    
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-6 sticky top-0 z-10 py-2 -mx-6 px-6">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-3 p-2 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Appearance</h2>
        
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
          <select
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={activeTheme}
            onChange={handleThemeChange}
          >
            {THEME_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block mb-3 font-medium text-gray-700 dark:text-gray-300">
            Choose Theme
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => handleThemeButtonClick('light')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
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
            </button>
            
            <button
              onClick={() => handleThemeButtonClick('dark')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
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
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Other Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">More settings will be available soon.</p>
      </div>
    </div>
  );
};

export default SettingsPage;