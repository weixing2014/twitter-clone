'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Comment } from '../types/comment';
import { getCommentsByUserId } from '../utils/commentService';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

export default function CommentsPage() {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComments = async () => {
    try {
      if (user?.id) {
        const fetchedComments = await getCommentsByUserId(user.id);
        setComments(fetchedComments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [user?.id]);

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
        <h2 className='text-xl font-bold text-gray-900 dark:text-white'>My Comments</h2>
      </div>
      {!user ? (
        <div className='p-4 text-center text-gray-500 dark:text-gray-400'>
          Sign in to see your comments!
        </div>
      ) : comments.length === 0 ? (
        <div className='p-4 text-center text-gray-500 dark:text-gray-400'>
          You haven't made any comments yet.
        </div>
      ) : (
        <div className='divide-y divide-gray-200 dark:divide-gray-800'>
          {comments.map((comment) => (
            <div key={comment.id} className='p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50'>
              <div className='flex items-start space-x-3'>
                <Link href={`/users/${comment.user_id}`} className='block group cursor-pointer'>
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
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center space-x-1'>
                    <Link
                      href={`/users/${comment.user_id}`}
                      className='font-bold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer'
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
                  <p className='mt-1 text-gray-900 dark:text-white whitespace-pre-wrap break-words'>
                    {comment.content}
                  </p>
                </div>
              </div>

              {/* Original Post */}
              {comment.post && (
                <div className='mt-3 pl-11 border-l-2 border-gray-200 dark:border-gray-700'>
                  <div className='flex items-start space-x-3'>
                    <Link
                      href={`/users/${comment.post.user_id}`}
                      className='block group cursor-pointer'
                    >
                      <div className='h-6 w-6 rounded-full overflow-hidden relative bg-gray-200 dark:bg-gray-700'>
                        <Image
                          src={
                            comment.post.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/png?seed=${comment.post.username}`
                          }
                          alt={comment.post.username || 'User'}
                          width={24}
                          height={24}
                          className='object-cover'
                          unoptimized
                        />
                      </div>
                    </Link>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center space-x-1'>
                        <Link
                          href={`/users/${comment.post.user_id}`}
                          className='text-sm font-medium text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer'
                        >
                          {comment.post.username}
                        </Link>
                        <span className='text-gray-500 dark:text-gray-400'>·</span>
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                          {formatDistanceToNow(new Date(comment.post.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className='mt-1 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words'>
                        {comment.post.content}
                      </p>
                      {comment.post.image_urls && comment.post.image_urls.length > 0 && (
                        <div className='mt-2 grid grid-cols-4 gap-1'>
                          {comment.post.image_urls.map((imageUrl, index) => (
                            <div
                              key={index}
                              className='aspect-square rounded-lg overflow-hidden group cursor-pointer'
                            >
                              <img
                                src={imageUrl}
                                alt={`Post image ${index + 1}`}
                                className='w-full h-full object-cover transition-transform group-hover:scale-105'
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
