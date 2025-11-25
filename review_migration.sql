-- Add media_urls and helpful_votes to ratings table
ALTER TABLE ratings 
ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS helpful_votes integer DEFAULT 0;

-- Create rating_votes table to track user votes
CREATE TABLE IF NOT EXISTS rating_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type boolean DEFAULT true, -- true for helpful
  created_at timestamptz DEFAULT now(),
  UNIQUE(rating_id, user_id)
);

-- Enable RLS on rating_votes
ALTER TABLE rating_votes ENABLE ROW LEVEL SECURITY;

-- Policy for reading votes (everyone can read)
CREATE POLICY "Everyone can read rating votes" ON rating_votes
  FOR SELECT USING (true);

-- Policy for inserting votes (authenticated users only)
CREATE POLICY "Authenticated users can vote" ON rating_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for deleting votes (users can remove their own vote)
CREATE POLICY "Users can remove their own vote" ON rating_votes
  FOR DELETE USING (auth.uid() = user_id);
