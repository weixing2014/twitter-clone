export interface MentionedUser {
  id: string;
  username: string;
}

export interface Post {
  id: string;
  content: string;
  user_id: string;
  image_urls: string[];
  mentions: string[] | null;
  topics: string[] | null;
  created_at: string;
  username: string;
  avatar_url: string | null;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}
