interface StatsDisplayProps {
  likeCount: number
  commentCount: number
  saveCount: number
}
export function StatsDisplay({ likeCount, commentCount, saveCount }: StatsDisplayProps) {
  return (
    <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
          <div className="flex-1 flex flex-col items-center">
            <p className="font-bold text-lg text-red-600">{likeCount || 0}</p>
            <p className="text-xs font-medium">Likes</p>
          </div>

          <div className="w-px h-8 bg-gray-300 dark:bg-gray-700 mx-2"></div>
          <div className="flex-1 flex flex-col items-center">
            <p className="font-bold text-lg text-blue-600">{commentCount}</p>
            <p className="text-xs font-medium">Comments</p>
          </div>

          <div className="w-px h-8 bg-gray-300 dark:bg-gray-700 mx-2"></div>
          <div className="flex-1 flex flex-col items-center">
            <p className="font-bold text-lg text-purple-600">{saveCount || 0}</p>
            <p className="text-xs font-medium">Saves</p>
          </div>
        </div>
    </div>
  )
}
