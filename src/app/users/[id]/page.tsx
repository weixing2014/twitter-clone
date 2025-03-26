'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Post } from '../../types/post';
import { getPostsByUserId } from '../../utils/postService';
import { getUserById } from '../../utils/userService';
import { UserProfile } from '../../utils/userService';
import { formatDistanceToNow } from 'date-fns';
import PostsSection from '../../components/PostsSection';

export default function UserProfilePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user profile
        const userData = await getUserById(params.id as string);
        if (!userData) {
          setError('User not found');
          return;
        }
        setUser(userData);

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

  return (
    <div className='max-w-2xl mx-auto px-4 py-8'>
      {/* User Profile Header */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8'>
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
      </div>

      {/* Posts Section */}
      <PostsSection
        posts={posts}
        isLoading={isLoading}
        currentUserId={currentUser?.id}
        onPostDeleted={(postId) => {
          setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        }}
        emptyMessage='No posts yet'
      />
    </div>
  );
}
