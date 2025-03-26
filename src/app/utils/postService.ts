import { supabase } from './supabase';

export type Post = {
  id: string;
  user_id: string;
  content: string;
  username: string;
  avatar_url?: string;
  created_at: string;
};

// Get all posts
export const getPosts = async (): Promise<Post[]> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

// Get posts from users the current user is following
export const getFollowingPosts = async (currentUserId: string): Promise<Post[]> => {
  try {
    // First, get the IDs of users the current user is following
    const { data: followings, error: followingsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);

    if (followingsError) {
      throw followingsError;
    }

    // If not following anyone yet, return empty array
    if (!followings || followings.length === 0) {
      return [];
    }

    // Extract the user IDs
    const followingIds = followings.map((follow) => follow.following_id);

    // Get posts from these users
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false });

    if (postsError) {
      throw postsError;
    }

    return posts || [];
  } catch (error) {
    console.error('Error fetching following posts:', error);
    return [];
  }
};

// Create a new post
export const createPost = async (
  userId: string,
  content: string,
  username: string,
  avatarUrl?: string
): Promise<Post | null> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          user_id: userId,
          content,
          username,
          avatar_url: avatarUrl,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
};

export const getPostsByUserId = async (userId: string): Promise<Post[]> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPostsByUserId:', error);
    throw error;
  }
};

export const deletePost = async (postId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deletePost:', error);
    throw error;
  }
};
