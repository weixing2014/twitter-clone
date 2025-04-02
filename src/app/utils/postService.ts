import { Post, MentionedUser } from '../types/post';
import { extractMentions, extractTopics } from '../utils/parsers';
import { supabase } from './supabase';

interface RawPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_urls: string[] | null;
  likes: number | null;
  topics: string[] | null;
  mentions: string[] | null;
  scheduled_at: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

const transformPost = (post: RawPost, mentionedUsersMap: Map<string, MentionedUser>): Post => {
  // Convert user IDs to usernames in the content
  let processedContent = post.content;
  if (post.mentions && post.mentions.length > 0) {
    post.mentions.forEach((userId: string) => {
      const mentionedUser = mentionedUsersMap.get(userId);
      if (mentionedUser) {
        // Use word boundary to avoid partial matches
        processedContent = processedContent.replace(
          new RegExp(`@${userId}\\b`, 'g'),
          `@${mentionedUser.username}`
        );
      }
    });
  }

  return {
    id: post.id,
    content: processedContent,
    created_at: post.created_at,
    user_id: post.user_id,
    username: post.profiles.username || 'Deleted User',
    avatar_url: post.profiles.avatar_url,
    image_urls: post.image_urls || [],
    topics: post.topics || [],
    mentions: post.mentions || [],
    likes_count: post.likes || 0,
    scheduled_at: post.scheduled_at,
  };
};

export const createPost = async (content: string, imageUrls: string[] = [], scheduledAt?: Date) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Extract mentioned usernames and get their IDs
  const mentionedUsernames = extractMentions(content);
  const mentions: string[] = [];
  let processedContent = content;
  let mentionedUsers: { id: string; username: string }[] | null = null;

  if (mentionedUsernames.length > 0) {
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', mentionedUsernames);

    if (userError) throw userError;
    mentionedUsers = users;

    // Replace usernames with user IDs in the content
    mentionedUsers?.forEach((mentionedUser) => {
      processedContent = processedContent.replace(
        new RegExp(`@${mentionedUser.username}\\b`, 'g'),
        `@${mentionedUser.id}`
      );
      mentions.push(mentionedUser.id);
    });
  }

  // Extract topics from content and get their IDs
  const topicNames = extractTopics(content);
  const topics: string[] = [];

  if (topicNames.length > 0) {
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .upsert(
        topicNames.map((name) => ({ name })),
        { onConflict: 'name' }
      )
      .select('id');

    if (topicError) throw topicError;
    topics.push(...(topicData?.map((topic) => topic.id) || []));
  }

  // Ensure imageUrls is an array
  const imageUrlsArray = Array.isArray(imageUrls) ? imageUrls : [];

  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        content: processedContent,
        user_id: user.id,
        image_urls: imageUrlsArray,
        mentions: mentions.length > 0 ? mentions : null,
        topics: topics.length > 0 ? topics : null,
        scheduled_at: scheduledAt?.toISOString() || null,
      },
    ])
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

  if (error) throw error;

  console.log('Created post data:', data);

  // Create a map of mentioned users
  const mentionedUsersMap = new Map<string, MentionedUser>(
    (data.mentions || []).map((id: string) => {
      const mentionedUser = mentionedUsers?.find(
        (user: { id: string; username: string }) => user.id === id
      );
      return [id, { id, username: mentionedUser?.username || 'Unknown User' }];
    })
  );

  // Transform the data to match the Post type
  return transformPost(data as RawPost, mentionedUsersMap);
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

      // For the current user, include their scheduled posts
      // For other users, only show non-scheduled posts
      query = query.or(
        `user_id.eq.${currentUserId},and(scheduled_at.is.null,user_id.in.(${userIds.join(',')}))`
      );
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

    console.log('Raw posts data:', data);

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
      mentionedUsers?.map((user: MentionedUser) => [user.id, user]) || []
    );

    // Transform the data to match the Post type
    return data
      .filter((post) => post.profiles) // Only include posts with valid profiles
      .map((post) => transformPost(post as RawPost, mentionedUsersMap));
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
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    // Get the users that the current user follows
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);

    const followingIds = followingData?.map((follow) => follow.following_id) || [];

    // Filter posts to only include posts from followed users
    const followingPosts = data.filter((post) => followingIds.includes(post.user_id));

    // Get all mentioned user IDs from all posts
    const allMentionedUserIds = followingPosts
      .flatMap((post) => post.mentions || [])
      .filter((id): id is string => id !== null);

    // Fetch mentioned users' information in a single query
    const { data: mentionedUsers } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', allMentionedUserIds);

    // Create a map of user IDs to usernames
    const mentionedUsersMap = new Map(
      mentionedUsers?.map((user: MentionedUser) => [user.id, user]) || []
    );

    // Transform the data to match the Post type
    return followingPosts
      .filter((post) => post.profiles) // Only include posts with valid profiles
      .map((post) => transformPost(post as RawPost, mentionedUsersMap));
  } catch (error) {
    console.error('Error in getFollowingPosts:', error);
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

    if (error) throw error;
    if (!data) return [];

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
      mentionedUsers?.map((user: MentionedUser) => [user.id, user]) || []
    );

    // Transform the data to match the Post type
    return data
      .filter((post) => post.profiles) // Only include posts with valid profiles
      .map((post) => transformPost(post as RawPost, mentionedUsersMap));
  } catch (error) {
    console.error('Error in getPostsByUserId:', error);
    return [];
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

    if (error) throw error;
    if (!data) return [];

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
      mentionedUsers?.map((user: MentionedUser) => [user.id, user]) || []
    );

    // Transform the data to match the Post type
    return data
      .filter((post) => post.profiles) // Only include posts with valid profiles
      .map((post) => transformPost(post as RawPost, mentionedUsersMap));
  } catch (error) {
    console.error('Error in getPostsMentioningUser:', error);
    return [];
  }
};
