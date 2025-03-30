-- First, create a temporary column to store the old mentions
ALTER TABLE posts ADD COLUMN mentions_old TEXT[];

-- Copy the current mentions to the temporary column
UPDATE posts SET mentions_old = mentions;

-- Drop the old mentions column
ALTER TABLE posts DROP COLUMN mentions;

-- Add the new mentions column with UUID type
ALTER TABLE posts ADD COLUMN mentions UUID[];

-- Update the new column with the converted values
UPDATE posts 
SET mentions = (
  SELECT array_agg(CAST(value AS UUID))
  FROM unnest(mentions_old) AS value
  WHERE value IS NOT NULL
);

-- Drop the temporary column
ALTER TABLE posts DROP COLUMN mentions_old; 