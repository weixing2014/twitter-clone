-- Add scheduled_at column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- Create index for faster scheduled posts queries
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts (scheduled_at);

-- Update the posts table to handle scheduled posts
CREATE OR REPLACE FUNCTION handle_scheduled_posts()
RETURNS void AS $$
BEGIN
  -- Update posts where scheduled_at is in the past
  UPDATE posts
  SET created_at = scheduled_at,
      scheduled_at = NULL
  WHERE scheduled_at IS NOT NULL
    AND scheduled_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to handle scheduled posts
CREATE OR REPLACE FUNCTION trigger_scheduled_posts()
RETURNS TRIGGER AS $$
BEGIN
  -- If scheduled_at is set and in the past, set it to created_at
  IF NEW.scheduled_at IS NOT NULL AND NEW.scheduled_at <= NOW() THEN
    NEW.created_at := NEW.scheduled_at;
    NEW.scheduled_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for handling scheduled posts
DROP TRIGGER IF EXISTS handle_scheduled_posts_trigger ON posts;
CREATE TRIGGER handle_scheduled_posts_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_scheduled_posts(); 