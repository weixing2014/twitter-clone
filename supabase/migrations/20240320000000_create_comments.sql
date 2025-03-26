-- Create comments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
        CREATE TABLE comments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Create indexes
        CREATE INDEX comments_post_id_idx ON comments(post_id);
        CREATE INDEX comments_user_id_idx ON comments(user_id);

        -- Enable Row Level Security
        ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Comments are viewable by everyone"
            ON comments FOR SELECT
            USING (true);

        CREATE POLICY "Users can insert their own comments"
            ON comments FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own comments"
            ON comments FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own comments"
            ON comments FOR DELETE
            USING (auth.uid() = user_id);

        -- Create updated_at trigger
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON comments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        -- Insert some dummy comments
        INSERT INTO comments (post_id, user_id, content)
        SELECT 
            p.id as post_id,
            u.id as user_id,
            CASE 
                WHEN p.user_id = u.id THEN 'This is my own post!'
                ELSE 'Great post! Keep it up!'
            END as content
        FROM posts p
        CROSS JOIN profiles u
        WHERE u.id != p.user_id
        LIMIT 5;
    END IF;
END $$; 