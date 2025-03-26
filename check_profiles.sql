-- Check the structure of the profiles table
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Count the number of rows in the profiles table
SELECT COUNT(*) FROM profiles;

-- List all users in the profiles table
SELECT * FROM profiles;

-- Check the Row Level Security policies on the profiles table
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if the trigger is correctly set up
SELECT 
  event_object_table AS table_name,
  trigger_name,
  action_timing AS timing,
  event_manipulation AS event,
  action_statement AS action
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'profiles'
OR trigger_name = 'on_auth_user_created'; 