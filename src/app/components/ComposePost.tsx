'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../utils/postService';
import { searchUsers, UserProfile } from '../utils/userService';
import { searchTopics } from '../utils/topicService';
import { supabase } from '../utils/supabase';
import { Post } from '../types/post';

interface ImagePreview {
  file: File;
  url: string;
}

interface ComposePostProps {
  onPostCreated: (post: Post) => void;
}

const ComposePost = ({ onPostCreated }: ComposePostProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<UserProfile[]>([]);
  const [topicQuery, setTopicQuery] = useState('');
  const [topicSuggestions, setTopicSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowMentionSuggestions(false);
        setShowTopicSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const newPosition = e.target.selectionStart;
    setContent(newContent);
    setCursorPosition(newPosition);

    // Check for @ symbol
    const lastAtSymbol = newContent.lastIndexOf('@', newPosition);
    if (lastAtSymbol !== -1) {
      const nextSpace = newContent.indexOf(' ', lastAtSymbol);
      // Only show suggestions if we're typing between @ and space
      if (nextSpace === -1 || nextSpace > newPosition) {
        const query = newContent.slice(lastAtSymbol + 1, nextSpace === -1 ? undefined : nextSpace);
        setMentionQuery(query);
        setShowMentionSuggestions(true);
        setShowTopicSuggestions(false);
      } else {
        setShowMentionSuggestions(false);
        setMentionQuery('');
      }
    } else {
      setShowMentionSuggestions(false);
      setMentionQuery('');
    }

    // Check for # symbol
    const lastHashSymbol = newContent.lastIndexOf('#', newPosition);
    if (lastHashSymbol !== -1) {
      const nextSpace = newContent.indexOf(' ', lastHashSymbol);
      const query = newContent.slice(lastHashSymbol + 1, nextSpace === -1 ? undefined : nextSpace);

      // If there's a space after the topic, hide suggestions
      if (nextSpace !== -1 && nextSpace < newPosition) {
        setShowTopicSuggestions(false);
      } else {
        setTopicQuery(query);
        setShowTopicSuggestions(true);
        setShowMentionSuggestions(false);
      }
    } else {
      setShowTopicSuggestions(false);
      setTopicQuery('');
    }
  };

  const handleUserSelect = (selectedUser: UserProfile) => {
    const beforeMention = content.slice(0, content.lastIndexOf('@'));
    const afterMention = content.slice(content.lastIndexOf('@') + mentionQuery.length + 1);
    const newContent = `${beforeMention}@${selectedUser.username} ${afterMention}`;
    setContent(newContent);
    setShowMentionSuggestions(false);
    setMentionQuery('');

    // Focus back on textarea and place cursor after the mention
    if (textareaRef.current) {
      textareaRef.current.focus();
      const cursorPosition = beforeMention.length + selectedUser.username.length + 2; // +2 for @ and space
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  };

  const handleTopicSelect = (selectedTopic: { id: string; name: string }) => {
    const beforeTopic = content.slice(0, content.lastIndexOf('#'));
    const afterTopic = content.slice(content.lastIndexOf('#') + topicQuery.length + 1);
    const newContent = `${beforeTopic}#${selectedTopic.name} ${afterTopic}`;
    setContent(newContent);
    setShowTopicSuggestions(false);
    setTopicQuery('');

    // Focus back on textarea and place cursor after the topic
    if (textareaRef.current) {
      textareaRef.current.focus();
      const cursorPosition = beforeTopic.length + selectedTopic.name.length + 2; // +2 for # and space
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionSuggestions && !showTopicSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const firstSuggestion = suggestionsRef.current?.querySelector('button');
      if (firstSuggestion) {
        (firstSuggestion as HTMLElement).focus();
      }
    }
  };

  const handleSuggestionKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const suggestions = showMentionSuggestions ? mentionSuggestions : topicSuggestions;
    if (e.key === 'ArrowDown' && index < suggestions.length - 1) {
      e.preventDefault();
      const nextSuggestion = suggestionsRef.current?.querySelectorAll('button')[index + 1];
      if (nextSuggestion) {
        (nextSuggestion as HTMLElement).focus();
      }
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prevSuggestion = suggestionsRef.current?.querySelectorAll('button')[index - 1];
      if (prevSuggestion) {
        (prevSuggestion as HTMLElement).focus();
      }
    } else if (e.key === 'Escape') {
      setShowMentionSuggestions(false);
      setShowTopicSuggestions(false);
    }
  };

  useEffect(() => {
    const searchForUsers = async () => {
      if (mentionQuery.length > 0) {
        const users = await searchUsers(mentionQuery);
        setMentionSuggestions(users);
      } else {
        setMentionSuggestions([]);
      }
    };

    const searchForTopics = async () => {
      if (topicQuery.length > 0) {
        const topics = await searchTopics(topicQuery);
        setTopicSuggestions(topics);
      } else {
        setTopicSuggestions([]);
      }
    };

    const debounceTimeout = setTimeout(() => {
      if (showMentionSuggestions) {
        searchForUsers();
      } else if (showTopicSuggestions) {
        searchForTopics();
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [mentionQuery, topicQuery, showMentionSuggestions, showTopicSuggestions]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX;
      const y = e.clientY;
      if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
        setIsDragging(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError('Please drop image files');
      return;
    }

    if (imageFiles.length + imagePreviews.length > 4) {
      setError('You can only add up to 4 images');
      return;
    }

    const newPreviews: ImagePreview[] = imageFiles
      .map((file) => {
        if (file.size > 5 * 1024 * 1024) {
          setError('Image size should be less than 5MB');
          return null;
        }
        return {
          file,
          url: URL.createObjectURL(file),
        };
      })
      .filter((preview): preview is ImagePreview => preview !== null);

    if (newPreviews.length > 0) {
      setImagePreviews((prev) => [...prev, ...newPreviews]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && imagePreviews.length === 0) return;

    setIsSubmitting(true);
    try {
      // Upload images first
      const imageUrls = await Promise.all(
        imagePreviews.map(async (preview) => {
          const fileExt = preview.file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${user?.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(filePath, preview.file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from('post-images').getPublicUrl(filePath);

          return publicUrl;
        })
      );

      // Create post with content and image URLs
      const newPost = await createPost(content, imageUrls);
      if (newPost) {
        onPostCreated(newPost);
        setContent('');
        setImagePreviews([]);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index].url);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError('Please select image files');
      return;
    }

    if (imageFiles.length + imagePreviews.length > 4) {
      setError('You can only add up to 4 images');
      return;
    }

    const newPreviews: ImagePreview[] = imageFiles
      .map((file) => {
        if (file.size > 5 * 1024 * 1024) {
          setError('Image size should be less than 5MB');
          return null;
        }
        return {
          file,
          url: URL.createObjectURL(file),
        };
      })
      .filter((preview): preview is ImagePreview => preview !== null);

    if (newPreviews.length > 0) {
      setImagePreviews((prev) => [...prev, ...newPreviews]);
      setError('');
    }
  };

  if (!user) {
    return null;
  }

  const remainingChars = 280 - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className='border-b border-gray-200 dark:border-gray-800 p-4'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='flex space-x-4'>
          <div className='flex-shrink-0'>
            <div className='h-12 w-12 rounded-full overflow-hidden relative bg-gray-200 dark:bg-gray-700'>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  width={48}
                  height={48}
                  className='object-cover'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600'>
                  <span className='text-gray-500 dark:text-gray-400 text-lg'>
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className='flex-1 min-w-0'>
            <div
              ref={dropZoneRef}
              className={`relative ${
                isDragging ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              } rounded-lg transition-colors duration-200`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="What's happening?"
                className='w-full resize-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none'
                rows={1}
              />
              {isDragging && (
                <div className='absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                  <p className='text-blue-500 dark:text-blue-400 font-medium'>Drop images here</p>
                </div>
              )}
            </div>
            {showMentionSuggestions && mentionSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className='absolute z-10 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto'
              >
                {mentionSuggestions.map((user, index) => (
                  <button
                    key={user.id}
                    type='button'
                    onClick={() => handleUserSelect(user)}
                    onKeyDown={(e) => handleSuggestionKeyDown(e, index)}
                    className='w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700'
                  >
                    <div className='flex items-center space-x-2'>
                      <div className='h-8 w-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700'>
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <div className='h-full w-full flex items-center justify-center'>
                            <span className='text-gray-500 dark:text-gray-400'>
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className='text-gray-900 dark:text-white'>{user.username}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showTopicSuggestions && topicSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className='absolute z-10 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto'
              >
                {topicSuggestions.map((topic, index) => (
                  <button
                    key={topic.id}
                    type='button'
                    onClick={() => handleTopicSelect(topic)}
                    onKeyDown={(e) => handleSuggestionKeyDown(e, index)}
                    className='w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700'
                  >
                    <div className='flex items-center space-x-2'>
                      <span className='text-gray-900 dark:text-white'>#{topic.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {imagePreviews.length > 0 && (
              <div className='mt-2 grid grid-cols-4 gap-1'>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className='relative aspect-square rounded-lg overflow-hidden'>
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className='w-full h-full object-cover'
                    />
                    <button
                      type='button'
                      onClick={() => handleRemoveImage(index)}
                      className='absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        strokeWidth={1.5}
                        stroke='currentColor'
                        className='w-3 h-3'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {error && <div className='text-red-500 text-sm mt-1'>{error}</div>}
            <div className='flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-3 mt-3'>
              <div className='flex items-center space-x-2'>
                <label className='cursor-pointer'>
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    className='hidden'
                    onChange={handleImageSelect}
                  />
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='w-6 h-6 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z'
                    />
                  </svg>
                </label>
                <div
                  className={`text-sm ${
                    isOverLimit ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {remainingChars} characters remaining
                </div>
              </div>
              <button
                type='submit'
                disabled={
                  isSubmitting || isOverLimit || (!content.trim() && imagePreviews.length === 0)
                }
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
