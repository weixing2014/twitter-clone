'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHotTopics } from '../utils/topicService';

interface HotTopic {
  id: string;
  name: string;
  count: number;
}

export const HotTopicsSidebar = () => {
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHotTopics = async () => {
      try {
        const topics = await getHotTopics();
        setHotTopics(topics);
      } catch (error) {
        console.error('Error loading hot topics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHotTopics();
  }, []);

  if (isLoading) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Hot Topics</h2>
        <div className='space-y-2'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='animate-pulse'>
              <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4'></div>
              <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-1'></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hotTopics.length === 0) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Hot Topics</h2>
        <p className='text-gray-500 dark:text-gray-400'>No hot topics in the last 24 hours</p>
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
      <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Hot Topics</h2>
      <div className='space-y-3'>
        {hotTopics.map((topic) => (
          <div key={topic.id} className='flex items-center justify-between'>
            <Link
              href={`/topics/${topic.name}`}
              className='text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors'
            >
              #{topic.name}
            </Link>
            <span className='text-sm text-gray-500 dark:text-gray-400'>{topic.count} posts</span>
          </div>
        ))}
      </div>
    </div>
  );
};
