'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Post } from './types/post';
import { getPosts } from './utils/postService';
import ComposePost from './components/ComposePost';
import PostsSection from './components/PostsSection';
import { PostCard } from './components/PostCard';
import { HotTopicsSidebar } from './components/HotTopicsSidebar';

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
    <main className='container mx-auto px-4 py-8'>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        <div className='lg:col-span-8'>
          {user && <ComposePost onPostCreated={handlePostCreated} />}
          <div className='mt-8 space-y-4'>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
            ))}
          </div>
        </div>
        <div className='lg:col-span-4'>
          <HotTopicsSidebar />
        </div>
      </div>
    </main>
  );
}
