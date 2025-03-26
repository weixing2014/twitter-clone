'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import ComposePost from './components/ComposePost';
import PostsSection from './components/PostsSection';
import { getPosts, getFollowingPosts, Post as PostType } from './utils/postService';

export default function Home() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const currentUserId = user?.id;

  const loadFeed = async () => {
    setIsLoading(true);
    let feed: PostType[] = [];

    if (currentUserId) {
      // Get both following posts and current user's posts
      const followingPosts = await getFollowingPosts(currentUserId);

      // Get all posts
      const allPosts = await getPosts();

      // Filter to include only current user's posts
      const userPosts = allPosts.filter((post) => post.user_id === currentUserId);

      // Combine and sort by date (newest first)
      feed = [...followingPosts, ...userPosts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Remove any duplicates (in case current user follows themselves)
      feed = feed.filter((post, index, self) => index === self.findIndex((p) => p.id === post.id));
    } else {
      // For non-logged in users, just show all posts
      feed = await getPosts();
    }

    setPosts(feed);
    setIsLoading(false);
  };

  useEffect(() => {
    loadFeed();
  }, [currentUserId]);

  const handlePostCreated = () => {
    loadFeed();
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  return (
    <main className='max-w-2xl mx-auto'>
      <div className='px-4 py-3 border-b border-gray-200 dark:border-gray-800'>
        <h2 className='text-xl font-bold text-gray-900 dark:text-white'>Home</h2>
      </div>

      {/* Compose Post Area (only shown to logged-in users) */}
      <ComposePost onPostCreated={handlePostCreated} />

      {/* Posts List */}
      <PostsSection
        posts={posts}
        isLoading={isLoading}
        currentUserId={currentUserId}
        onPostDeleted={handlePostDeleted}
        emptyMessage={
          !currentUserId
            ? 'Sign in to create posts and join the conversation!'
            : 'No posts found. Create a post or follow users to see their posts here!'
        }
      />
    </main>
  );
}
