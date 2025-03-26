'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { createPost } from '../utils/postService';

type ComposePostProps = {
  onPostCreated: () => void;
};

const ComposePost = ({ onPostCreated }: ComposePostProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Post cannot be empty');
      return;
    }

    if (content.length > 280) {
      setError('Post cannot exceed 280 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (!user) throw new Error('User not authenticated');

      // Create post using the service
      const newPost = await createPost(
        user.id,
        content.trim(),
        user.username || user.email?.split('@')[0] || 'Anonymous',
        user.avatar_url || undefined
      );

      if (!newPost) {
        throw new Error('Failed to create post');
      }

      // Clear the textarea
      setContent('');

      // Notify parent component to refresh posts
      onPostCreated();
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  if (!user) {
    return null; // Don't render anything if user is not logged in
  }

  const remainingChars = 280 - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className='border-b border-gray-200 dark:border-gray-800 p-4'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='flex space-x-4'>
          <div className='flex-shrink-0'>
            <div className='h-12 w-12 rounded-full overflow-hidden relative bg-gray-200 dark:bg-gray-700'>
              <Image
                src={
                  user.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username || user.id}`
                }
                alt={user.username || 'User'}
                width={48}
                height={48}
                className='object-cover'
                unoptimized
              />
            </div>
          </div>
          <div className='flex-grow'>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's happening?"
              className='w-full border-0 focus:ring-0 text-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none overflow-hidden min-h-[80px] p-2'
              aria-label='Compose post'
            />

            {error && <div className='text-red-500 text-sm mt-1'>{error}</div>}

            <div className='flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-3 mt-3'>
              <div
                className={`text-sm ${
                  isOverLimit ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {remainingChars} characters remaining
              </div>
              <button
                type='submit'
                disabled={isSubmitting || isOverLimit || !content.trim()}
                className='px-4 py-2 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ComposePost;
