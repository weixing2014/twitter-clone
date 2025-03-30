'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types/post';
import { getPostsMentioningUser } from '../utils/postService';
import PostsSection from '../components/PostsSection';

export default function MentionsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      if (user?.id) {
        const fetchedPosts = await getPostsMentioningUser(user.id);
        setPosts(fetchedPosts);
      }
    } catch (error) {
      console.error('Error loading mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user?.id]);

  const handlePostDeleted = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='max-w-2xl mx-auto'>
      <div className='px-4 py-3 border-b border-gray-200 dark:border-gray-800'>
        <h2 className='text-xl font-bold text-gray-900 dark:text-white'>@Me</h2>
      </div>
      <PostsSection
        posts={posts}
        isLoading={loading}
        currentUserId={user?.id || ''}
        onPostDeleted={handlePostDeleted}
        emptyMessage={
          !user ? 'Sign in to see posts where you are mentioned!' : 'No posts mention you yet.'
        }
      />
    </div>
  );
}
