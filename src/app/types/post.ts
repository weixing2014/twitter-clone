export interface Post {
  id: string;
  content: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  image_urls?: string[];
  created_at: string;
}
