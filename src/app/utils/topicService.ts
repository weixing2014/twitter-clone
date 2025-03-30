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

    // Get posts that contain the topic ID
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

    if (postsError) throw postsError;

    // Get the IDs of users that the current user follows
    let followingIds: string[] = [];
    if (currentUserId) {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);
      followingIds = following?.map((f) => f.following_id) || [];
    }

    // Transform the data to match the Post type
    return (posts || []).map((post) => ({
      ...post,
      username: post.profiles?.username,
      avatar_url: post.profiles?.avatar_url,
      isFollowing: followingIds.includes(post.user_id),
    }));
  } catch (error) {
    console.error('Error fetching posts by topic:', error);
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
