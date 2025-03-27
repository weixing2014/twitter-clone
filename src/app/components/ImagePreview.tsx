'use client';

import { useState } from 'react';

interface ImagePreviewProps {
  imageUrl: string;
  alt?: string;
  className?: string;
}

export const ImagePreview = ({
  imageUrl,
  alt = 'Post image',
  className = '',
}: ImagePreviewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <>
      <div
        className={`relative cursor-pointer group ${className}`}
        onClick={handleOpenModal}
        onKeyDown={(e) => e.key === 'Enter' && handleOpenModal()}
        role='button'
        tabIndex={0}
        aria-label='Click to view full size image'
      >
        <img src={imageUrl} alt={alt} className='w-full h-full object-cover rounded-lg' />
        <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15'
            />
          </svg>
        </div>
      </div>

      {isModalOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4'
          onClick={handleCloseModal}
        >
          <div className='relative max-w-4xl w-full max-h-[90vh]'>
            <img src={imageUrl} alt={alt} className='w-full h-full object-contain' />
            <button
              onClick={handleCloseModal}
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
    </>
  );
};
