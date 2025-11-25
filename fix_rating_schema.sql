-- Ensure ratings table has necessary columns
ALTER TABLE ratings 
ADD COLUMN IF NOT EXISTS rating_condition integer CHECK (rating_condition >= 1 AND rating_condition <= 5),
ADD COLUMN IF NOT EXISTS rating_communication integer CHECK (rating_communication >= 1 AND rating_communication <= 5),
ADD COLUMN IF NOT EXISTS rating_value integer CHECK (rating_value >= 1 AND rating_value <= 5),
ADD COLUMN IF NOT EXISTS rating_accuracy integer CHECK (rating_accuracy >= 1 AND rating_accuracy <= 5),
ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'removed')),
ADD COLUMN IF NOT EXISTS flag_reason text,
ADD COLUMN IF NOT EXISTS helpful_votes integer DEFAULT 0;

-- Add unique constraint for upsert functionality (one rating per user per listing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ratings_user_listing_unique'
    ) THEN
        ALTER TABLE ratings 
        ADD CONSTRAINT ratings_user_listing_unique UNIQUE (user_id, listing_id);
    END IF;
END $$;

-- Create rating_replies table if it doesn't exist
CREATE TABLE IF NOT EXISTS rating_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create rating_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS rating_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type boolean DEFAULT true, -- true for helpful
  created_at timestamptz DEFAULT now(),
  UNIQUE(rating_id, user_id)
);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates/conflicts
DROP POLICY IF EXISTS "Users can insert their own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON ratings;
DROP POLICY IF EXISTS "Everyone can view published ratings" ON ratings;
DROP POLICY IF EXISTS "Users can view their own ratings" ON ratings;
DROP POLICY IF EXISTS "Everyone can view rating replies" ON rating_replies;
DROP POLICY IF EXISTS "Users can insert rating replies" ON rating_replies;
DROP POLICY IF EXISTS "Everyone can read rating votes" ON rating_votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON rating_votes;
DROP POLICY IF EXISTS "Users can remove their own vote" ON rating_votes;

-- Create Policies for Ratings

-- Allow users to insert their own ratings
CREATE POLICY "Users can insert their own ratings" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own ratings
CREATE POLICY "Users can update their own ratings" ON ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow everyone to view published ratings
CREATE POLICY "Everyone can view published ratings" ON ratings
  FOR SELECT USING (status = 'published');

-- Allow users to view their own ratings (even if not published/flagged)
CREATE POLICY "Users can view their own ratings" ON ratings
  FOR SELECT USING (auth.uid() = user_id);

-- Create Policies for Rating Replies

-- Allow everyone to view replies
CREATE POLICY "Everyone can view rating replies" ON rating_replies
  FOR SELECT USING (true);

-- Allow users to insert replies
CREATE POLICY "Users can insert rating replies" ON rating_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create Policies for Rating Votes

-- Policy for reading votes (everyone can read)
CREATE POLICY "Everyone can read rating votes" ON rating_votes
  FOR SELECT USING (true);

-- Policy for inserting votes (authenticated users only)
CREATE POLICY "Authenticated users can vote" ON rating_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for deleting votes (users can remove their own vote)
CREATE POLICY "Users can remove their own vote" ON rating_votes
  FOR DELETE USING (auth.uid() = user_id);
