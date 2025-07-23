import { User } from "lucide-react"
import type { Comment } from "../../types/mems"

interface CommentItemProps {
  comment: Comment
  onProfileClick: (username: string) => void
}

export function CommentItem({ comment, onProfileClick }: CommentItemProps) {
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }
  return (
  <div className="flex items-start space-x-3 p-3 rounded-xl transition-all duration-200">
    <button onClick={() => onProfileClick(comment.username)}>
      {comment.profilePictureUrl ? (
        <img
          src={comment.profilePictureUrl || "/placeholder.svg"}
          alt={comment.username}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
        />
      ) : (
        <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
          <User className="w-4 h-4" />
        </div>
      )}
    </button>

    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-2 mb-1">
        <button
          onClick={() => onProfileClick(comment.username)}
          className="font-semibold text-black dark:text-white text-sm hover:text-indigo-600 transition-colors duration-200 truncate"
        >
          {comment.username}
        </button>
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {formatDate(comment.createdAt)}
        </span>
      </div>

      <p className="text-black dark:text-slate-300 text-sm leading-relaxed">
        {comment.text}
      </p>
    </div>
  </div>
);

}
