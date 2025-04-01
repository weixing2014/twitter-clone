export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  username?: string;
  avatar_url?: string;
  post: {
    content: string;
    user: {
      username: string;
      avatar_url: string | null;
    };
  };
}
