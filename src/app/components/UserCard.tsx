'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserProfile } from '../utils/userService';
import { followUser, unfollowUser } from '../utils/userService';

interface UserCardProps {
  user: UserProfile;
  currentUserId?: string;
  onFollowStatusChange: () => void;
}

const UserCard = ({ user, currentUserId, onFollowStatusChange }: UserCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const canFollow = currentUserId && currentUserId !== user.id;

  const handleFollowToggle = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      if (user.is_following) {
        await unfollowUser(currentUserId, user.id);
      } else {
        await followUser(currentUserId, user.id);
      }
      onFollowStatusChange();
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
      <div className='flex items-center justify-between'>
        <Link href={`/users/${user.id}`} className='flex items-center space-x-4 flex-1'>
          <img
            src={user.avatar_url || '/default-avatar.png'}
            alt={`${user.username}'s avatar`}
            className='w-12 h-12 rounded-full object-cover'
          />
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-white'>{user.username}</h3>
            <p className='text-sm text-gray-500 dark:text-gray-400'>{user.email}</p>
          </div>
        </Link>
        {canFollow && (
          <button
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              user.is_following
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            aria-label={user.is_following ? 'Unfollow user' : 'Follow user'}
          >
            {isLoading ? 'Loading...' : user.is_following ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
};

export default UserCard;
