import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users } from 'lucide-react';
import type { UserApi } from '../../types/mems';

interface UserCardProps {
  user: UserApi;
  onClick?: (user: UserApi) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(user);
    } else if (user.username) {
      navigate(`/profile/${user.username}`);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          {user.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={`${user.username}'s profile`}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-200">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
            {user.username}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{user.followersCount} followers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
