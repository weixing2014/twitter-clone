'use client';

import Link from 'next/link';
import { useState } from 'react';
import { UserProfile } from '../utils/userService';
import { followUser, unfollowUser } from '../utils/userService';

interface UserCardProps {
  user: UserProfile;
  currentUserId?: string;
  onFollowStatusChange?: (userId: string, isFollowing: boolean) => void;
}

const UserCard = ({ user, currentUserId, onFollowStatusChange }: UserCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user.is_following || false);
  const canFollow = currentUserId && currentUserId !== user.id;

  const handleFollowToggle = async () => {
    if (!canFollow || isLoading || !currentUserId) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        const success = await unfollowUser(currentUserId, user.id);
        if (success) {
          setIsFollowing(false);
          onFollowStatusChange?.(user.id, false);
        }
      } else {
        const success = await followUser(currentUserId, user.id);
        if (success) {
          setIsFollowing(true);
          onFollowStatusChange?.(user.id, true);
        }
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors'>
      <div className='flex items-center space-x-3'>
        <Link href={`/users/${user.id}`} className='block group'>
          <div className='h-12 w-12 rounded-full overflow-hidden relative bg-gray-200 dark:bg-gray-700'>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                width={48}
                height={48}
                className='object-cover'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600'>
                <span className='text-gray-500 dark:text-gray-400 text-lg'>
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </Link>
        <div>
          <Link
            href={`/users/${user.id}`}
            className='font-bold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer'
          >
            {user.username}
          </Link>
          <p className='text-sm text-gray-500 dark:text-gray-400'>{user.email}</p>
        </div>
      </div>
      {canFollow && (
        <button
          onClick={handleFollowToggle}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
            isFollowing
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );
};

export default UserCard;
