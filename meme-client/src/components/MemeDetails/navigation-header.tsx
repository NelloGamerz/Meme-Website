import { ArrowLeft, Share2 } from "lucide-react";

interface NavigationHeaderProps {
  onBack: () => void;
  onShare: () => void;
}

export function NavigationHeader({ onBack, onShare }: NavigationHeaderProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-full mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-all duration-200 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 group"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onShare}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 group"
            >
              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
