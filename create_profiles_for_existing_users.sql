-- Insert profiles for existing users who don't have profiles yet
INSERT INTO public.profiles (id, username, email, avatar_url, created_at)
SELECT 
  au.id, 
  COALESCE(
    au.raw_user_meta_data->>'username', 
    SPLIT_PART(au.email, '@', 1)
  ) as username,
  au.email,
  au.raw_user_meta_data->>'avatar_url',
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Verify the results
SELECT * FROM public.profiles; 