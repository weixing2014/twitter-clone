-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_post_topics_trigger ON posts;

-- Drop the existing functions
DROP FUNCTION IF EXISTS extract_topics;
DROP FUNCTION IF EXISTS update_post_topics;

-- First, drop the default value
ALTER TABLE posts ALTER COLUMN topics DROP DEFAULT;

-- Change the column type from TEXT[] to UUID[]
ALTER TABLE posts ALTER COLUMN topics TYPE UUID[] USING COALESCE(topics::text[]::uuid[], '{}'::uuid[]);

-- Set the new default value
ALTER TABLE posts ALTER COLUMN topics SET DEFAULT '{}'::uuid[]; 