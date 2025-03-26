import { supabase } from './supabase';

export type UserProfile = {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  is_following?: boolean;
};

export const getUsers = async (currentUserId?: string): Promise<UserProfile[]> => {
  try {
    // Get all users from the profiles table
    const { data: users, error } = await supabase.from('profiles').select('*').order('username');

    if (error) {
      throw error;
    }

    // If we have a current user, check which users they're following
    if (currentUserId) {
      const { data: followings, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      if (followingError) {
        throw followingError;
      }

      // Create a set of followed user IDs for quick lookup
      const followingIds = new Set(followings?.map((f) => f.following_id) || []);

      // Add is_following flag to each user
      return (users || []).map((user) => ({
        ...user,
        is_following: followingIds.has(user.id),
      }));
    }

    return users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const followUser = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('follows')
      .insert([{ follower_id: followerId, following_id: followingId }]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
};

export const unfollowUser = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
};
