'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Comment } from '../types/comment';
import { getCommentsByUserId } from '../utils/commentService';
import Link from 'next/link';
import Image from 'next/image';

export default function CommentsPage() {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComments = async () => {
    if (!user?.id) return;

    try {
      const fetchedComments = await getCommentsByUserId(user.id);
      setComments(fetchedComments);
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
    return <div>Loading...</div>;
  }

  return (
    <div className='max-w-2xl mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>Your Comments</h1>
      <div className='space-y-6'>
        {comments.map((comment) => (
          <div key={comment.id} className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
            <div className='flex items-start space-x-3'>
              <Link href={`/profile/${comment.username}`} className='flex-shrink-0'>
                <Image
                  src={
                    comment.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`
                  }
                  alt={`${comment.username}'s avatar`}
                  width={40}
                  height={40}
                  className='rounded-full'
                />
              </Link>
              <div className='flex-1'>
                <div className='flex items-center space-x-2'>
                  <Link
                    href={`/profile/${comment.username}`}
                    className='font-semibold hover:underline'
                  >
                    {comment.username}
                  </Link>
                  <span className='text-gray-500 dark:text-gray-400'>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className='mt-1 text-gray-800 dark:text-gray-200'>{comment.content}</p>
              </div>
            </div>

            <div className='mt-3 pl-11 border-l-2 border-gray-200 dark:border-gray-700'>
              <div className='flex items-start space-x-3'>
                <Link href={`/profile/${comment.post.user.username}`} className='flex-shrink-0'>
                  <Image
                    src={
                      comment.post.user.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.post.user.username}`
                    }
                    alt={`${comment.post.user.username}'s avatar`}
                    width={32}
                    height={32}
                    className='rounded-full'
                  />
                </Link>
                <div className='flex-1'>
                  <div className='flex items-center space-x-2'>
                    <Link
                      href={`/profile/${comment.post.user.username}`}
                      className='font-semibold hover:underline'
                    >
                      {comment.post.user.username}
                    </Link>
                  </div>
                  <p className='mt-1 text-gray-600 dark:text-gray-400'>{comment.post.content}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
