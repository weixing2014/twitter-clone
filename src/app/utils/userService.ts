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

export const getUserById = async (
  userId: string,
  currentUserId?: string
): Promise<UserProfile | null> => {
  try {
    // Get user profile
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      throw error;
    }

    // If we have a current user, check if they're following this user
    if (currentUserId) {
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single();

      if (followError && followError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned"
        console.error('Error checking follow status:', followError);
        throw followError;
      }

      return {
        ...user,
        is_following: !!followData,
      };
    }

    return user;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
};

export const updateUsername = async (userId: string, newUsername: string): Promise<boolean> => {
  try {
    // Update username in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }

    // Update user metadata in auth.users
    const { error: authError } = await supabase.auth.updateUser({
      data: { username: newUsername },
    });

    if (authError) {
      throw authError;
    }

    return true;
  } catch (error) {
    console.error('Error updating username:', error);
    return false;
  }
};

export const searchUsers = async (query: string, limit: number = 5): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};
