'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Post } from './types/post';
import { getPosts } from './utils/postService';
import ComposePost from './components/ComposePost';
import PostsSection from './components/PostsSection';
import PostCard from './components/PostCard';

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      const fetchedPosts = await getPosts(user?.id);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

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
      {user && <ComposePost onPostCreated={handlePostCreated} />}
      <PostsSection
        posts={posts}
        isLoading={loading}
        currentUserId={user?.id || ''}
        onPostDeleted={handlePostDeleted}
        emptyMessage={
          !user
            ? 'Sign in to create posts and join the conversation!'
            : 'No posts found. Create a post or follow users to see their posts here!'
        }
      />
    </div>
  );
}
