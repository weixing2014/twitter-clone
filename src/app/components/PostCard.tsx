'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Post } from '../types/post';
import { deletePost } from '../utils/postService';
import { getCommentCount } from '../utils/commentService';
import { formatDistanceToNow, format } from 'date-fns';
import CommentSection from './CommentSection';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import {
  splitContent,
  isMention,
  isTopic,
  getUsernameFromMention,
  getTopicFromPart,
} from '../utils/parsers';

interface PostCardProps {
  post: Post;
  onPostDeleted: (postId: string) => void;
  currentUserId?: string;
}

export const PostCard = ({ post, onPostDeleted }: PostCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mentionedUsers, setMentionedUsers] = useState<{ id: string; username: string }[]>([]);
  const { user } = useAuth();
  const isCurrentUserPost = user?.id === post.user_id;

  useEffect(() => {
    loadCommentCount();
    loadMentionedUsers();
  }, [post.id, post.mentions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  // Don't render scheduled posts for non-owners
  if (post.scheduled_at && !isCurrentUserPost) {
    return null;
  }

  const isFuturePost = post.scheduled_at ? new Date(post.scheduled_at) > new Date() : false;

  const formattedDate = isFuturePost
    ? `Scheduled at ${format(new Date(post.scheduled_at!), 'MMM d, yyyy h:mm a')}`
    : formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  const loadCommentCount = async () => {
    const count = await getCommentCount(post.id);
    setCommentCount(count);
  };

  const loadMentionedUsers = async () => {
    if (post.mentions && post.mentions.length > 0) {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', post.mentions);

      if (!error && users) {
        setMentionedUsers(users);
      }
    }
  };

  const handleDelete = async () => {
    if (!isCurrentUserPost) return;

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      onPostDeleted(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const renderContent = () => {
    const parts = splitContent(post.content);
    return parts.map((part, index) => {
      if (isMention(part)) {
        const username = getUsernameFromMention(part);
        const mentionedUser = mentionedUsers.find((user) => user.username === username);

        if (mentionedUser) {
          return (
            <Link
              key={index}
              href={`/users/${mentionedUser.id}`}
              className='text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
            >
              @{mentionedUser.username}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      }

      if (isTopic(part)) {
        const topicName = getTopicFromPart(part);
        return (
          <Link
            key={index}
            href={`/topics/${topicName}`}
            className='text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
          >
            {part}
          </Link>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`border-b border-gray-200 dark:border-gray-800 p-4`}>
      <div className='flex space-x-4'>
        <div className='flex-shrink-0'>
          <div className='h-12 w-12 rounded-full overflow-hidden relative bg-gray-200 dark:bg-gray-700'>
            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt={post.username}
                width={48}
                height={48}
                className='object-cover'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600'>
                <span className='text-gray-500 dark:text-gray-400 text-lg'>
                  {post.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center space-x-1'>
            <Link
              href={`/users/${post.user_id}`}
              className='font-bold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer'
            >
              {post.username}
            </Link>
            <span className='text-gray-500 dark:text-gray-400'>·</span>
            <span className='text-gray-500 dark:text-gray-400'>{formattedDate}</span>
          </div>
          <div className='flex items-start justify-between mt-1'>
            <p
              className={`whitespace-pre-wrap break-words flex-1 ${
                isFuturePost ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
              }`}
            >
              {renderContent()}
            </p>
            <div className='flex items-center space-x-1 ml-4'>
              <button
                onClick={() => setShowComments(!showComments)}
                className='flex items-center text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='w-4 h-4'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z'
                  />
                </svg>
                <span className='ml-1 text-sm'>{commentCount}</span>
              </button>
              {isCurrentUserPost && (
                <button
                  onClick={() => setShowConfirmDialog(true)}
                  className='text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 cursor-pointer'
                  aria-label='Delete post'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='w-4 h-4'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {post.image_urls && post.image_urls.length > 0 && (
            <div className='mt-2 grid grid-cols-4 gap-1'>
              {post.image_urls.map((imageUrl, index) => (
                <div
                  key={index}
                  className='aspect-square rounded-lg overflow-hidden group cursor-pointer'
                >
                  <img
                    src={imageUrl}
                    alt={`Post image ${index + 1}`}
                    className='w-full h-full object-cover transition-transform group-hover:scale-105'
                    onClick={() => handleImageClick(imageUrl)}
                  />
                </div>
              ))}
            </div>
          )}
          {showComments && (
            <div className='mt-4 border-t border-gray-200 dark:border-gray-800 pt-4'>
              <CommentSection
                postId={post.id}
                currentUserId={post.user_id}
                onCommentChange={loadCommentCount}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showConfirmDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Delete Post
            </h3>
            <p className='text-gray-600 dark:text-gray-300 mb-6'>
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className='px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className='px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className='fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4'
          onClick={() => setSelectedImage(null)}
        >
          <div className='relative max-w-4xl w-full max-h-[90vh]'>
            <img
              src={selectedImage}
              alt='Full size post image'
              className='w-full h-full object-contain'
            />
            <button
              onClick={() => setSelectedImage(null)}
              className='absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors'
              aria-label='Close image preview'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='w-6 h-6'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
