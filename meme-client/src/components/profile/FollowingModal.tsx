import type React from "react"
import { useState } from "react"
import { X, Search } from "lucide-react"
import { Following } from "../../types/mems"
import { useModalControls } from "../../hooks/useModalControls"

interface FollowingModalProps {
  isOpen: boolean
  onClose: () => void
  following: Following[]
  isLoading: boolean
  onNavigateToProfile: (username: string) => void
}

export const FollowingModal: React.FC<FollowingModalProps> = ({
  isOpen,
  onClose,
  following,
  isLoading,
  onNavigateToProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  
  useModalControls(isOpen, onClose);

  const filteredFollowing = following.filter((follow) =>
    follow.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 dark:bg-black/20 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 m-4 animate-scaleIn">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Following</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search following..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredFollowing.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {filteredFollowing.map((following) => (
                  <li
                    key={following.userId}
                    className="py-3 flex items-center hover:bg-gray-50 rounded-lg px-2 cursor-pointer"
                    onClick={() => onNavigateToProfile(following.username)}
                  >
                    <div className="flex-shrink-0 h-10 w-10">
                      {following.profilePictureUrl ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={following.profilePictureUrl || "/placeholder.svg"}
                          alt={following.userId}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {following.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{following.username}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No users match your search" : "Not following anyone yet"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
