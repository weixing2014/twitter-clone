-- Create the posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts (user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts (created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policy for reading posts (everyone can read all posts)
CREATE POLICY "Allow public read access" ON public.posts
  FOR SELECT USING (true);

-- Create policy for creating posts (authenticated users can create their own posts)
-- Note: INSERT policies require WITH CHECK instead of USING
CREATE POLICY "Allow authenticated users to create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for updating posts (users can update their own posts)
CREATE POLICY "Allow users to update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for deleting posts (users can delete their own posts)
CREATE POLICY "Allow users to delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 