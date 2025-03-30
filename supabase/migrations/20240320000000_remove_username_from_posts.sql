-- Remove username and avatar_url columns from posts table
ALTER TABLE posts DROP COLUMN IF EXISTS username;
ALTER TABLE posts DROP COLUMN IF EXISTS avatar_url; 