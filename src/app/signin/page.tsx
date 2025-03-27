'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { login, signup, signInWithGoogle, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for mode parameter and set the form mode accordingly
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMessage('');

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      }
      // No need to redirect here - Supabase OAuth will handle the redirect
    } catch (err) {
      setError(
        typeof err === 'object' && err !== null && 'message' in err
          ? String(err.message)
          : 'An error occurred during Google sign in'
      );
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      try {
        const { error } = await signup(email, password);

        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage('Registration successful! Please check your email for verification.');
          // Reset form after successful signup
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      } catch (err) {
        setError(
          typeof err === 'object' && err !== null && 'message' in err
            ? String(err.message)
            : 'An error occurred during sign up'
        );
        console.error(err);
      }
    } else {
      try {
        const { error } = await login(email, password);

        if (error) {
          setError(error.message);
        } else {
          // Redirect to home page after successful login
          router.push('/');
        }
      } catch (err) {
        setError(
          typeof err === 'object' && err !== null && 'message' in err
            ? String(err.message)
            : 'An error occurred during sign in'
        );
        console.error(err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className='max-w-md mx-auto my-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md'>
      <div className='flex justify-center mb-6'>
        <img src='/logo.svg' alt='OhYea' width='64' height='64' className='mb-4' />
      </div>

      <div className='flex mb-6'>
        <button
          onClick={() => setIsSignUp(false)}
          className={`flex-1 text-center py-2 border-b-2 font-medium transition-colors cursor-pointer ${
            !isSignUp
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          aria-label='Sign in mode'
          aria-pressed={!isSignUp}
        >
          Sign In
        </button>
        <button
          onClick={() => setIsSignUp(true)}
          className={`flex-1 text-center py-2 border-b-2 font-medium transition-colors cursor-pointer ${
            isSignUp
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          aria-label='Sign up mode'
          aria-pressed={isSignUp}
        >
          Sign Up
        </button>
      </div>

      <h1 className='text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white'>
        {isSignUp ? 'Join OhYea' : 'Welcome back to OhYea'}
      </h1>

      {error && (
        <div className='mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm' role='alert'>
          {error}
        </div>
      )}

      {successMessage && (
        <div className='mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm' role='alert'>
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
          >
            Email
          </label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
            placeholder='Enter your email'
            disabled={isLoading}
            aria-label='Email'
          />
        </div>

        <div>
          <label
            htmlFor='password'
            className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
          >
            Password
          </label>
          <input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={!isSignUp ? handleKeyDown : undefined}
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
            placeholder='Enter your password (min. 6 characters)'
            disabled={isLoading}
            aria-label='Password'
          />
        </div>

        {isSignUp && (
          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
            >
              Confirm Password
            </label>
            <input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
              placeholder='Confirm your password'
              disabled={isLoading}
              aria-label='Confirm password'
            />
          </div>
        )}

        <button
          type='submit'
          disabled={isLoading}
          className='w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          aria-label={isSignUp ? 'Sign up' : 'Sign in'}
        >
          {isLoading
            ? isSignUp
              ? 'Signing up...'
              : 'Signing in...'
            : isSignUp
            ? 'Sign up'
            : 'Sign in'}
        </button>
      </form>

      <div className='mt-6'>
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-300 dark:border-gray-600'></div>
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'>
              Or continue with
            </span>
          </div>
        </div>

        <div className='mt-6'>
          <button
            type='button'
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className='w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer'
            aria-label='Sign in with Google'
          >
            <svg className='h-5 w-5 mr-2' viewBox='0 0 24 24'>
              <g transform='matrix(1, 0, 0, 1, 27.009001, -39.238998)'>
                <path
                  fill='#4285F4'
                  d='M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z'
                />
                <path
                  fill='#34A853'
                  d='M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z'
                />
                <path
                  fill='#FBBC05'
                  d='M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z'
                />
                <path
                  fill='#EA4335'
                  d='M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z'
                />
              </g>
            </svg>
            Sign {isSignUp ? 'up' : 'in'} with Google
          </button>
        </div>
      </div>

      <div className='mt-6 text-center text-sm text-gray-500 dark:text-gray-400'>
        <p>
          {isSignUp
            ? 'By signing up, you agree to our Terms of Service and Privacy Policy.'
            : 'Enter your email and password to sign in to your account.'}
        </p>
      </div>
    </div>
  );
}
