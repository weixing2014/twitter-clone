'use client';

import { Post } from '../types/post';
import PostCard from './PostCard';

interface PostsSectionProps {
  posts: Post[];
  isLoading?: boolean;
  emptyMessage?: string;
  currentUserId?: string;
  onPostDeleted?: (postId: string) => void;
}

const PostsSection = ({
  posts,
  isLoading,
  emptyMessage = 'No posts yet',
  currentUserId,
  onPostDeleted,
}: PostsSectionProps) => {
  if (isLoading) {
    return <div className='p-4 text-center text-gray-500 dark:text-gray-400'>Loading posts...</div>;
  }

  return (
    <div className='divide-y divide-gray-200 dark:divide-gray-800'>
      {posts.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-gray-500 dark:text-gray-400'>{emptyMessage}</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onPostDeleted={onPostDeleted}
          />
        ))
      )}
    </div>
  );
};

export default PostsSection;
