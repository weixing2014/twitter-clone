-- Add foreign key constraint to posts table
ALTER TABLE posts
ADD CONSTRAINT posts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE; 