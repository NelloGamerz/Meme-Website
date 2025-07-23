import { User } from "lucide-react"

interface UserInfoProps {
  username: string
  profilePictureUrl?: string
  createdAt: string | Date
  onProfileClick: (username: string) => void
}

export function UserInfo({ username, profilePictureUrl, createdAt, onProfileClick }: UserInfoProps) {
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => onProfileClick(username)}
        className="flex items-center space-x-3  backdrop-blur-sm rounded-xl p-3 -m-3 transition-all duration-200 group w-full"
      >
        {profilePictureUrl ? (
          <img
            src={profilePictureUrl || "/placeholder.svg"}
            alt={username}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md group-hover:ring-indigo-200 transition-all duration-200"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-md group-hover:ring-indigo-200 transition-all duration-200">
            <User className="w-5 h-5" />
          </div>
        )}

        <div className="text-left">
          <p className="font-semibold text-white group-hover:text-indigo-600 transition-colors duration-200">
            {username}
          </p>
          <p className="text-white text-sm">{formatDate(createdAt)}</p>
        </div>
      </button>
    </div>
  )
}
