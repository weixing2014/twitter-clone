-- Add mentions column to posts table
ALTER TABLE posts
ADD COLUMN mentions UUID[] DEFAULT '{}';

-- Create an index for better query performance
CREATE INDEX posts_mentions_idx ON posts USING GIN (mentions); 