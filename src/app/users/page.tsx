'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, UserProfile } from '../utils/userService';
import UserCard from '../components/UserCard';

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const currentUserId = user?.id;

  const loadUsers = async () => {
    setIsLoading(true);
    const fetchedUsers = await getUsers(currentUserId);
    setUsers(fetchedUsers);
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUserId) {
      loadUsers();
    }
  }, [currentUserId]);

  const handleFollowStatusChange = (userId: string, isFollowing: boolean) => {
    // Update the user in the list without reloading all users
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id === userId) {
          return { ...u, is_following: isFollowing };
        }
        return u;
      })
    );
  };

  return (
    <main className='max-w-2xl mx-auto'>
      <div className='px-4 py-3 border-b border-gray-200 dark:border-gray-800'>
        <h2 className='text-xl font-bold text-gray-900 dark:text-white'>Users</h2>
      </div>

      {/* Users List */}
      <section>
        {isLoading ? (
          <div className='p-4 text-center text-gray-500 dark:text-gray-400'>Loading users...</div>
        ) : users.length > 0 ? (
          users.map((userProfile) => (
            <UserCard
              key={userProfile.id}
              user={userProfile}
              currentUserId={currentUserId}
              onFollowStatusChange={handleFollowStatusChange}
            />
          ))
        ) : (
          <div className='p-4 text-center text-gray-500 dark:text-gray-400'>
            {!currentUserId ? 'Please sign in to see users and follow them.' : 'No users found.'}
          </div>
        )}
      </section>
    </main>
  );
}
