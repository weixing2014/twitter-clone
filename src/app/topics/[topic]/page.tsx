'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Post } from '../../types/post';
import { getPostsByTopic } from '../../utils/topicService';
import PostsSection from '../../components/PostsSection';
import { use } from 'react';

export default function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      const fetchedPosts = await getPostsByTopic(resolvedParams.topic);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading topic posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [resolvedParams.topic, user?.id]);

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
        <h2 className='text-xl font-bold text-gray-900 dark:text-white'>#{resolvedParams.topic}</h2>
      </div>
      <PostsSection
        posts={posts}
        isLoading={loading}
        currentUserId={user?.id || ''}
        onPostDeleted={(postId) => {
          setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        }}
        emptyMessage='No posts found for this topic.'
      />
    </div>
  );
}
