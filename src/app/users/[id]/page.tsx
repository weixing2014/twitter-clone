'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Post } from '../../types/post';
import { getPostsByUserId } from '../../utils/postService';
import { getUserById, followUser, unfollowUser, updateUsername } from '../../utils/userService';
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
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const params = useParams();
  const { user: currentUser, updateUsername: contextUpdateUsername } = useAuth();

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
        setNewUsername(userData.username);
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
  }, [params.id, currentUser?.id]);

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

  const handleUsernameUpdate = async () => {
    if (!currentUser || !user || isUpdatingUsername) return;

    setIsUpdatingUsername(true);
    setUsernameError(null);

    try {
      const success = await updateUsername(user.id, newUsername);
      if (success) {
        setUser({ ...user, username: newUsername });
        setIsEditingUsername(false);

        // Update username in the context
        contextUpdateUsername(newUsername);

        // Refresh posts to get updated usernames
        const updatedPosts = await getPostsByUserId(user.id);
        setPosts(updatedPosts);
      } else {
        setUsernameError('Failed to update username');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      setUsernameError('Failed to update username');
    } finally {
      setIsUpdatingUsername(false);
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
  const isOwnProfile = currentUser && currentUser.id === user.id;

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
              {isOwnProfile && isEditingUsername ? (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <input
                      type='text'
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className='flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      disabled={isUpdatingUsername}
                      placeholder='Enter new username'
                    />
                    <button
                      onClick={handleUsernameUpdate}
                      disabled={isUpdatingUsername || newUsername === user.username}
                      className='shrink-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isUpdatingUsername ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername(user.username);
                        setUsernameError(null);
                      }}
                      className='shrink-0 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600'
                    >
                      Cancel
                    </button>
                  </div>
                  {usernameError && <p className='text-sm text-red-500'>{usernameError}</p>}
                </div>
              ) : (
                <div className='flex items-center space-x-2'>
                  <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                    {user.username}
                  </h1>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className='p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400'
                      aria-label='Edit username'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        strokeWidth={1.5}
                        stroke='currentColor'
                        className='w-5 h-5'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10'
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
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
