'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';

const Header = () => {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await logout();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSignOut();
    }
  };

  // Display username if available, otherwise use email
  const displayName = user?.username || user?.email?.split('@')[0] || '';

  return (
    <header className='sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center space-x-4'>
            <Link href='/' className='text-xl font-bold text-blue-500' aria-label='Home'>
              OhYea
            </Link>
            <nav className='hidden md:flex space-x-2'>
              <Link
                href='/'
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/'
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                aria-current={pathname === '/' ? 'page' : undefined}
              >
                Home
              </Link>
              <Link
                href='/users'
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/users'
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                aria-current={pathname === '/users' ? 'page' : undefined}
              >
                Users
              </Link>
            </nav>
          </div>

          <div>
            {user ? (
              <div className='flex items-center gap-4'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Hello, <span className='font-semibold'>{displayName}</span>
                </span>
                <button
                  onClick={handleSignOut}
                  onKeyDown={handleKeyDown}
                  className='px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors'
                  tabIndex={0}
                  aria-label='Sign out'
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            ) : (
              <Link
                href='/signin'
                className='px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors'
                aria-label='Sign in'
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
