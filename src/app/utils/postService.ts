import { supabase } from './supabase';
import { Post } from '../types/post';

export const createPost = async (
  content: string,
  userId: string,
  imageUrls: string[] = []
): Promise<Post> => {
  try {
    // Extract mentioned usernames from content
    const mentionMatches = content.match(/@([^\s]+(?:\s+[^\s]+)*)/g) || [];
    const mentionedUsernames = mentionMatches.map((match) => match.slice(1));

    // Get mentioned users' IDs
    let mentions: string[] = [];
    let mentionedUsers: { id: string; username: string; avatar_url: string | null }[] = [];
    if (mentionedUsernames.length > 0) {
      const { data: users, error: mentionedUsersError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('username', mentionedUsernames);

      if (mentionedUsersError) throw mentionedUsersError;
      mentionedUsers = users || [];
      mentions = mentionedUsers.map((user) => user.id);
    }

    // Extract topics from content
    const topicMatches = content.match(/#([a-zA-Z0-9_]+)/g) || [];
    const topicNames = topicMatches.map((match) => match.slice(1));

    // Insert topics into the topics table if they don't exist and get their IDs
    let topicIds: string[] = [];
    if (topicNames.length > 0) {
      // First, insert the topics
      const { error: insertError } = await supabase.from('topics').upsert(
        topicNames.map((name) => ({ name })),
        { onConflict: 'name' }
      );

      if (insertError) throw insertError;

      // Then, get the topic IDs
      const { data: topics, error: selectError } = await supabase
        .from('topics')
        .select('id')
        .in('name', topicNames);

      if (selectError) throw selectError;
      if (topics) {
        topicIds = topics.map((topic) => topic.id);
      }
    }

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        content,
        user_id: userId,
        image_urls: imageUrls,
        mentions: mentions.length > 0 ? mentions : null,
        topics: topicIds.length > 0 ? topicIds : null,
      })
      .select(
        `
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `
      )
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      throw postError;
    }

    if (!post) {
      throw new Error('Post creation failed');
    }

    // Transform the data to match the Post type
    return {
      ...post,
      username: post.profiles?.username,
      avatar_url: post.profiles?.avatar_url,
      mentioned_users: mentionedUsers,
      topics: topicIds,
    };
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const getPosts = async (
  currentUserId?: string,
  fetchAll: boolean = false
): Promise<Post[]> => {
  try {
    if (!currentUserId && !fetchAll) {
      return [];
    }

    let query = supabase
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
      .order('created_at', { ascending: false });

    // If not fetching all posts, filter by following
    if (!fetchAll && currentUserId) {
      // Get the users that the current user follows
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      // Get the list of user IDs to fetch posts from (current user + followed users)
      const userIds = [
        currentUserId,
        ...(followingData?.map((follow) => follow.following_id) || []),
      ];

      // Add the filter for specific users
      query = query.in('user_id', userIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return [];
    }

    if (!data) {
      console.log('No posts found');
      return [];
    }

    // Get all mentioned user IDs from all posts
    const allMentionedUserIds = data
      .flatMap((post) => post.mentions || [])
      .filter((id): id is string => id !== null);

    // Fetch mentioned users' information in a single query
    const { data: mentionedUsers } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', allMentionedUserIds);

    // Create a map of user IDs to usernames
    const mentionedUsersMap = new Map(
      mentionedUsers?.map((user: { id: string; username: string }) => [user.id, user]) || []
    );

    // Transform the data to match the Post type
    const transformedPosts = data
      .filter((post) => post.profiles) // Only include posts with valid profiles
      .map((post) => ({
        ...post,
        username: post.profiles.username || 'Deleted User',
        avatar_url: post.profiles.avatar_url,
        mentions: post.mentions || [],
        mentioned_users: (post.mentions || [])
          .map((id: string) => mentionedUsersMap.get(id))
          .filter((user): user is { id: string; username: string } => user !== undefined),
      }));

    return transformedPosts;
  } catch (error) {
    console.error('Error in getPosts:', error);
    return [];
  }
};

export const deletePost = async (postId: string): Promise<void> => {
  try {
    // First, get the post to get the image URLs
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('image_urls')
      .eq('id', postId)
      .single();

    if (fetchError) throw fetchError;

    // If the post has images, delete them from storage
    if (post?.image_urls && post.image_urls.length > 0) {
      // Extract file paths from URLs
      const filePaths = post.image_urls
        .map((url: string) => {
          try {
            const urlObj = new URL(url);
            return urlObj.pathname.split('/').slice(-2).join('/'); // Get user_id/filename
          } catch (error) {
            console.error('Error parsing URL:', url, error);
            return '';
          }
        })
        .filter(Boolean); // Remove any empty strings

      // Delete all images from storage
      const { error: storageError } = await supabase.storage.from('post-images').remove(filePaths);

      if (storageError) {
        console.error('Error deleting images from storage:', storageError);
        // Continue with post deletion even if image deletion fails
      }
    }

    // Delete the post from the database
    const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
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

export const getPostsByUserId = async (userId: string): Promise<Post[]> => {
  try {
    const { data, error } = await supabase
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Get all mentioned user IDs from all posts
    const allMentionedUserIds = data
      .flatMap((post) => post.mentions || [])
      .filter((id): id is string => id !== null);

    // Fetch mentioned users' information in a single query
    const { data: mentionedUsers } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', allMentionedUserIds);

    // Create a map of user IDs to usernames
    const mentionedUsersMap = new Map(
      mentionedUsers?.map((user: { id: string; username: string }) => [user.id, user]) || []
    );

    // Transform the data to match the Post type
    return data.map((post) => ({
      ...post,
      username: post.profiles.username,
      avatar_url: post.profiles.avatar_url,
      mentions: post.mentions || [],
      mentioned_users: (post.mentions || [])
        .map((id: string) => mentionedUsersMap.get(id))
        .filter((user): user is { id: string; username: string } => user !== undefined),
    }));
  } catch (error) {
    console.error('Error in getPostsByUserId:', error);
    throw error;
  }
};

export const getPostsMentioningUser = async (userId: string): Promise<Post[]> => {
  try {
    const { data, error } = await supabase
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
      .contains('mentions', [userId])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Get all mentioned user IDs from all posts
    const allMentionedUserIds = data
      .flatMap((post) => post.mentions || [])
      .filter((id): id is string => id !== null);

    // Fetch mentioned users' information in a single query
    const { data: mentionedUsers } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', allMentionedUserIds);

    // Create a map of user IDs to usernames
    const mentionedUsersMap = new Map(
      mentionedUsers?.map((user: { id: string; username: string }) => [user.id, user]) || []
    );

    // Transform the data to match the Post type
    return data.map((post) => ({
      ...post,
      username: post.profiles.username,
      avatar_url: post.profiles.avatar_url,
      mentions: post.mentions || [],
      mentioned_users: (post.mentions || [])
        .map((id: string) => mentionedUsersMap.get(id))
        .filter((user): user is { id: string; username: string } => user !== undefined),
    }));
  } catch (error) {
    console.error('Error in getPostsMentioningUser:', error);
    throw error;
  }
};
