'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Comment } from '../types/comment';
import { getComments, createComment, deleteComment } from '../utils/commentService';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  onCommentChange?: () => void;
}

const CommentSection = ({ postId, currentUserId, onCommentChange }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    const fetchedComments = await getComments(postId);
    setComments(fetchedComments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    setIsLoading(true);
    try {
      const comment = await createComment(postId, newComment.trim());
      if (comment) {
        setComments([...comments, comment]);
        setNewComment('');
        onCommentChange?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    const success = await deleteComment(commentId);
    if (success) {
      setComments(comments.filter((comment) => comment.id !== commentId));
      onCommentChange?.();
    }
  };

  return (
    <div className='mt-4 space-y-4'>
      <form onSubmit={handleSubmit} className='flex space-x-2'>
        <input
          type='text'
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder='Write a comment...'
          className='flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
        />
        <button
          type='submit'
          disabled={isLoading || !newComment.trim()}
          className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isLoading ? 'Posting...' : 'Post'}
        </button>
      </form>

      <div className='space-y-4'>
        {comments.map((comment) => (
          <div key={comment.id} className='flex space-x-3'>
            <div className='flex-shrink-0'>
              <Link href={`/users/${comment.user_id}`} className='block group'>
                <div className='h-8 w-8 rounded-full overflow-hidden relative bg-gray-200 dark:bg-gray-700'>
                  <Image
                    src={
                      comment.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/png?seed=${comment.username}`
                    }
                    alt={comment.username || 'User'}
                    width={32}
                    height={32}
                    className='object-cover'
                    unoptimized
                  />
                </div>
              </Link>
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-1'>
                  <Link
                    href={`/users/${comment.user_id}`}
                    className='font-bold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors'
                  >
                    {comment.username}
                  </Link>
                  <span className='text-gray-500 dark:text-gray-400'>·</span>
                  <span className='text-gray-500 dark:text-gray-400'>
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {currentUserId === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className='text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1'
                    aria-label='Delete comment'
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
              <p className='mt-1 text-gray-900 dark:text-white whitespace-pre-wrap break-words'>
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
