'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Post } from '../../types/post';
import { getPostsByUserId } from '../../utils/postService';
import { getUserById, followUser, unfollowUser } from '../../utils/userService';
import { UserProfile } from '../../utils/userService';
import { formatDistanceToNow } from 'date-fns';
import PostsSection from '../../components/PostsSection';

export default function UserProfilePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const params = useParams();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user profile
        const userData = await getUserById(params.id as string, currentUser?.id);
        if (!userData) {
          setError('User not found');
          return;
        }
        setUser(userData);
        setIsFollowing(userData.is_following || false);

        // Get user's posts
        const userPosts = await getPostsByUserId(params.id as string);
        setPosts(userPosts);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadUserData();
    }
  }, [params.id]);

  const handleFollowToggle = async () => {
    if (!currentUser || !user || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const success = await unfollowUser(currentUser.id, user.id);
        if (success) {
          setIsFollowing(false);
        }
      } else {
        const success = await followUser(currentUser.id, user.id);
        if (success) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[60vh]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex justify-center items-center min-h-[60vh]'>
        <div className='text-red-500 text-center'>
          <p className='text-lg font-semibold'>{error}</p>
          <p className='text-sm mt-2'>Please try again later</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex justify-center items-center min-h-[60vh]'>
        <div className='text-gray-500 text-center'>
          <p className='text-lg font-semibold'>User not found</p>
        </div>
      </div>
    );
  }

  const canFollow = currentUser && currentUser.id !== user.id;

  return (
    <div className='max-w-2xl mx-auto px-4 py-8'>
      {/* User Profile Header */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <img
                src={user.avatar_url || '/default-avatar.png'}
                alt={`${user.username}'s avatar`}
                className='w-20 h-20 rounded-full object-cover'
              />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>{user.username}</h1>
              <p className='text-gray-500 dark:text-gray-400'>{user.email}</p>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {canFollow && (
            <button
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                isFollowing
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isFollowLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* User's Posts */}
      <PostsSection
        posts={posts}
        onPostDeleted={(postId) => {
          setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        }}
      />
    </div>
  );
}
