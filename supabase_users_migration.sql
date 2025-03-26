-- Create profiles table to store user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create index on username for faster queries
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for reading profiles (everyone can read all profiles)
CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);

-- Create policy for updating profiles (users can update their own profile)
CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    new.id, 
    CASE 
      WHEN new.raw_user_meta_data->>'username' IS NOT NULL AND new.raw_user_meta_data->>'username' != '' 
      THEN new.raw_user_meta_data->>'username' 
      ELSE split_part(new.email, '@', 1)
    END,
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to create a profile entry
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create follows table to track user follows
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure a user can't follow the same user twice
  UNIQUE(follower_id, following_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows (following_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policy for reading follows (everyone can read all follows)
CREATE POLICY "Allow public read access to follows" ON public.follows
  FOR SELECT USING (true);

-- Create policy for inserting follows (users can only create their own follows)
CREATE POLICY "Allow users to create their own follows" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Create policy for deleting follows (users can only delete their own follows)
CREATE POLICY "Allow users to delete their own follows" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Create trigger for profile updated_at
CREATE OR REPLACE FUNCTION update_profile_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_modified_column(); 