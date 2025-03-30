-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add topics array to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Create index for faster topic searches
CREATE INDEX IF NOT EXISTS idx_posts_topics ON posts USING GIN (topics);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_post_topics_trigger ON posts;

-- Create function to extract topics from post content
CREATE OR REPLACE FUNCTION extract_topics(content TEXT)
RETURNS TEXT[] AS $$
BEGIN
  RETURN (
    SELECT array_agg(DISTINCT substring(match[1] from 2))
    FROM regexp_matches(content, '#([a-zA-Z0-9_]+)', 'g') match
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to automatically update topics when post content changes
CREATE OR REPLACE FUNCTION update_post_topics()
RETURNS TRIGGER AS $$
BEGIN
  NEW.topics := extract_topics(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_topics_trigger
  BEFORE INSERT OR UPDATE OF content ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_topics();

-- Enable RLS on topics table
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Create policies for topics table
CREATE POLICY "Enable read access for all users" ON topics
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON topics
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON topics
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated'); 