'use client';

import { useState } from 'react';
import Image from 'next/image';
import { UserProfile, followUser, unfollowUser } from '../utils/userService';

type UserCardProps = {
  user: UserProfile;
  currentUserId?: string;
  onFollowStatusChange: (userId: string, isFollowing: boolean) => void;
};

const UserCard = ({ user, currentUserId, onFollowStatusChange }: UserCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user.is_following);
  const canFollow = !!currentUserId && currentUserId !== user.id;

  const handleFollowToggle = async () => {
    if (!currentUserId || isLoading) return;

    setIsLoading(true);
    const newFollowState = !isFollowing;

    try {
      let success;
      if (newFollowState) {
        // Follow
        success = await followUser(currentUserId, user.id);
      } else {
        // Unfollow
        success = await unfollowUser(currentUserId, user.id);
      }

      if (success) {
        // Update local state first for immediate UI feedback
        setIsFollowing(newFollowState);
        // Notify parent component
        onFollowStatusChange(user.id, newFollowState);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='border-b border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors'>
      <div className='flex justify-between items-center'>
        <div className='flex items-center space-x-3'>
          <div className='h-12 w-12 rounded-full overflow-hidden relative bg-gray-200 dark:bg-gray-700'>
            <Image
              src={
                user.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username || user.id}`
              }
              alt={user.username || 'User'}
              width={48}
              height={48}
              className='object-cover'
              unoptimized
            />
          </div>
          <div>
            <div className='font-bold text-gray-900 dark:text-white'>{user.username}</div>
            {user.email && (
              <div className='text-sm text-gray-500 dark:text-gray-400'>{user.email}</div>
            )}
          </div>
        </div>

        {canFollow && (
          <button
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isFollowing
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading
              ? isFollowing
                ? 'Unfollowing...'
                : 'Following...'
              : isFollowing
              ? 'Unfollow'
              : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
};

export default UserCard;
