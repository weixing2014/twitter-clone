'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Suspense } from 'react';

function SignInContent() {
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setSuccessMessage('');
      await signInWithGoogle();
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4'>
      <div className='w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900'>Welcome Back</h2>
          <p className='mt-2 text-sm text-gray-600'>Sign in to your account to continue</p>
        </div>

        {error && <div className='rounded-md bg-red-50 p-4 text-sm text-red-700'>{error}</div>}

        {successMessage && (
          <div className='rounded-md bg-green-50 p-4 text-sm text-green-700'>{successMessage}</div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className='flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-2 text-gray-700 shadow-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
        >
          <svg className='h-5 w-5' aria-hidden='true' viewBox='0 0 24 24'>
            <path
              d='M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z'
              fill='currentColor'
            />
          </svg>
          <span className='text-sm font-semibold leading-6'>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}

// Wrap the component that uses useSearchParams in Suspense
export default function SignIn() {
  return (
    <Suspense fallback={<div className='flex justify-center p-6'>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
