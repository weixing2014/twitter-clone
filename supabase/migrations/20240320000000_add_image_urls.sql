-- Add image_urls column to posts table
ALTER TABLE posts
ADD COLUMN image_urls TEXT[] DEFAULT NULL;

-- Update RLS policies to allow image_urls
CREATE POLICY "Users can update their own posts with images"
ON posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add comment about the change
COMMENT ON COLUMN posts.image_urls IS 'Array of image URLs for posts with multiple images'; 