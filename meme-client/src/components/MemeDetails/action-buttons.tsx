import { Heart, Bookmark } from "lucide-react";
import { cn } from "../../hooks/utils";

interface ActionButtonsProps {
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  // onDownload: () => void;
}

export function ActionButtons({
  isLiked,
  isSaved,
  onLike,
  onSave,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={onSave}
          className={cn(
            "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
            isSaved
              ? "bg-gray-800 hover:bg-gray-900 text-white"
              : "bg-white text-black hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          )}
        >
          <div className="flex items-center space-x-2">
            <Bookmark
              className={cn("w-4 h-4", isSaved ? "fill-current" : "")}
            />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </div>
        </button>
      </div>

      <button
        onClick={onLike}
        className={cn(
          "p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group",
          isLiked
            ? "text-red-500 bg-red-50/80 backdrop-blur-sm hover:bg-red-100/80"
            : "text-slate-700 hover:bg-white/60 backdrop-blur-sm hover:text-red-500"
        )}
      >
        <Heart
          className={cn(
            "w-6 h-6 group-hover:scale-110 transition-transform duration-200",
            isLiked && "fill-current"
          )}
        />
      </button>
    </div>
  );
}
