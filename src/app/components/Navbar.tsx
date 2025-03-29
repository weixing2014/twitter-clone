'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import UserDropdown from './UserDropdown';

function NavLinks() {
  return (
    <div className='flex items-center space-x-8'>
      <Link
        href='/'
        className='flex items-center text-xl font-bold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400'
      >
        OhYeah
      </Link>
      <Link
        href='/explore'
        className='text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400'
      >
        Explore
      </Link>
      <Link
        href='/users'
        className='text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400'
      >
        Users
      </Link>
    </div>
  );
}

function AuthSection() {
  const { user } = useAuth();

  return (
    <div className='flex items-center space-x-4'>
      {user ? (
        <UserDropdown />
      ) : (
        <Link
          href='/signin'
          className='text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400'
        >
          Sign in
        </Link>
      )}
    </div>
  );
}

export default function Navbar() {
  return (
    <nav className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <NavLinks />
          <AuthSection />
        </div>
      </div>
    </nav>
  );
}
