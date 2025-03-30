export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  image_urls?: string[] | null;
  created_at: string;
  updated_at: string;
  username?: string;
  avatar_url?: string;
}
