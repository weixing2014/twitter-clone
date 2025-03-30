import { supabase } from './supabase';
import { Post } from '../types/post';

export const getPostsByTopic = async (topic: string, currentUserId?: string): Promise<Post[]> => {
  try {
    // First, get the topic ID by name
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select('id')
      .eq('name', topic)
      .single();

    if (topicError) {
      console.error('Error fetching topic:', topicError);
      return [];
    }

    if (!topicData) {
      console.log('Topic not found');
      return [];
    }

    // Get posts containing this topic ID
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
      .contains('topics', [topicData.id])
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return [];
    }

    if (!posts) {
      return [];
    }

    // Get all mentioned user IDs from all posts
    const allMentionedUserIds = posts
      .flatMap((post) => post.mentions || [])
      .filter((id): id is string => id !== null);

    // Fetch mentioned users' information in a single query
    const { data: mentionedUsers } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', allMentionedUserIds);

    // Create a map of user IDs to user information
    const mentionedUsersMap = new Map(mentionedUsers?.map((user) => [user.id, user]) || []);

    // Transform the data to match the Post type
    return posts.map((post) => ({
      ...post,
      username: post.profiles?.username || 'Deleted User',
      avatar_url: post.profiles?.avatar_url,
      mentions: post.mentions || [],
      mentioned_users: (post.mentions || [])
        .map((id) => mentionedUsersMap.get(id))
        .filter(
          (user): user is { id: string; username: string; avatar_url: string | null } =>
            user !== undefined
        ),
    }));
  } catch (error) {
    console.error('Error in getPostsByTopic:', error);
    return [];
  }
};

export const getTrendingTopics = async (limit: number = 10): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('topics')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Count topic occurrences
    const topicCounts = new Map<string, number>();
    data?.forEach((post) => {
      post.topics?.forEach((topicId) => {
        topicCounts.set(topicId, (topicCounts.get(topicId) || 0) + 1);
      });
    });

    // Get topic names for the most frequent topic IDs
    const topTopicIds = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([topicId]) => topicId);

    // Fetch topic names
    const { data: topics } = await supabase.from('topics').select('name').in('id', topTopicIds);

    // Return topic names in the same order as their frequency
    return topics?.map((topic) => topic.name) || [];
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return [];
  }
};

export const searchTopics = async (query: string): Promise<{ id: string; name: string }[]> => {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('id, name')
      .ilike('name', `${query}%`)
      .limit(5);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching topics:', error);
    return [];
  }
};
