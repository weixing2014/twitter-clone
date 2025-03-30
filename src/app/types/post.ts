export interface MentionedUser {
  id: string;
  username: string;
}

export interface Post {
  id: string;
  content: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  image_urls?: string[];
  created_at: string;
  mentions?: string[];
  mentioned_users?: MentionedUser[];
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}
