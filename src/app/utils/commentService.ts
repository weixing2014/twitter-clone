import { createClient } from '@supabase/supabase-js';
import { Comment } from '../types/comment';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const getComments = async (postId: string): Promise<Comment[]> => {
  try {
    // First, get all comments for the post
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (commentsError) throw commentsError;

    // Then, get all unique user IDs from the comments
    const userIds = [...new Set(comments.map((comment) => comment.user_id))];

    // Fetch profiles for all users who commented
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    // Create a map of user IDs to profiles for easy lookup
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    // Combine comments with their corresponding profiles
    return comments.map((comment) => ({
      ...comment,
      username: profileMap.get(comment.user_id)?.username,
      avatar_url: profileMap.get(comment.user_id)?.avatar_url,
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export const createComment = async (postId: string, content: string): Promise<Comment | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First, create the comment
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          user_id: user.id,
          content,
        },
      ])
      .select('*')
      .single();

    if (commentError) throw commentError;

    // Then, fetch the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Combine the comment with the profile data
    return {
      ...comment,
      username: profile.username,
      avatar_url: profile.avatar_url,
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    return null;
  }
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
};

export const getCommentCount = async (postId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching comment count:', error);
    return 0;
  }
};

export const getCommentsByUserId = async (userId: string): Promise<Comment[]> => {
  try {
    // First, get all comments for the user
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (commentsError) throw commentsError;

    // Then, get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Get all unique post IDs from the comments
    const postIds = [...new Set(comments.map((comment) => comment.post_id))];

    // Fetch posts and their authors
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(
        `
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `
      )
      .in('id', postIds);

    if (postsError) throw postsError;

    // Create a map of post IDs to posts for easy lookup
    const postMap = new Map(
      posts.map((post) => [
        post.id,
        {
          ...post,
          username: post.profiles?.username,
          avatar_url: post.profiles?.avatar_url,
        },
      ])
    );

    // Combine comments with the profile data and post data
    return (comments || []).map((comment) => ({
      ...comment,
      username: profile.username,
      avatar_url: profile.avatar_url,
      post: postMap.get(comment.post_id),
    }));
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return [];
  }
};
