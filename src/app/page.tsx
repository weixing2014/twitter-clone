'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from './context/AuthContext';
import ComposePost from './components/ComposePost';
import { getPosts, getFollowingPosts, Post as PostType } from './utils/postService';
import { formatDistanceToNow } from 'date-fns';

const PostCard = ({ post }: { post: PostType }) => {
  const formattedDate = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <article className='border-b border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors'>
      <div className='flex space-x-3'>
        <div className='flex-shrink-0'>
          <div className='h-12 w-12 rounded-full overflow-hidden relative bg-gray-200 dark:bg-gray-700'>
            <Image
              src={
                post.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/png?seed=${post.username}`
              }
              alt={post.username}
              width={48}
              height={48}
              className='object-cover'
              unoptimized
            />
          </div>
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center space-x-1'>
            <span className='font-bold text-gray-900 dark:text-white'>{post.username}</span>
            <span className='text-gray-500 dark:text-gray-400'>·</span>
            <span className='text-gray-500 dark:text-gray-400'>{formattedDate}</span>
          </div>
          <p className='mt-1 text-gray-900 dark:text-white whitespace-pre-wrap break-words'>
            {post.content}
          </p>
        </div>
      </div>
    </article>
  );
};

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

  return (
    <main className='max-w-2xl mx-auto'>
      <div className='px-4 py-3 border-b border-gray-200 dark:border-gray-800'>
        <h2 className='text-xl font-bold text-gray-900 dark:text-white'>Home</h2>
      </div>

      {/* Compose Post Area (only shown to logged-in users) */}
      <ComposePost onPostCreated={handlePostCreated} />

      {/* Posts List */}
      <section className='divide-y divide-gray-200 dark:divide-gray-800'>
        {isLoading ? (
          <div className='p-4 text-center text-gray-500 dark:text-gray-400'>Loading posts...</div>
        ) : posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className='p-4 text-center text-gray-500 dark:text-gray-400'>
            {!currentUserId
              ? 'Sign in to create posts and join the conversation!'
              : 'No posts found. Create a post or follow users to see their posts here!'}
          </div>
        )}
      </section>
    </main>
  );
}
