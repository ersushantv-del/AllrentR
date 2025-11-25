-- Add missing columns to ratings table for enhanced review system
ALTER TABLE public.ratings 
ADD COLUMN IF NOT EXISTS rating_condition integer CHECK (rating_condition >= 1 AND rating_condition <= 5),
ADD COLUMN IF NOT EXISTS rating_communication integer CHECK (rating_communication >= 1 AND rating_communication <= 5),
ADD COLUMN IF NOT EXISTS rating_value integer CHECK (rating_value >= 1 AND rating_value <= 5),
ADD COLUMN IF NOT EXISTS rating_accuracy integer CHECK (rating_accuracy >= 1 AND rating_accuracy <= 5),
ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'removed')),
ADD COLUMN IF NOT EXISTS flag_reason text,
ADD COLUMN IF NOT EXISTS helpful_votes integer DEFAULT 0;

-- Create rating_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rating_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id uuid REFERENCES public.ratings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type boolean DEFAULT true, -- true for helpful
  created_at timestamptz DEFAULT now(),
  UNIQUE(rating_id, user_id)
);

-- Enable RLS
ALTER TABLE public.rating_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates/conflicts
DROP POLICY IF EXISTS "Everyone can read rating votes" ON public.rating_votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.rating_votes;
DROP POLICY IF EXISTS "Users can remove their own vote" ON public.rating_votes;

-- Create Policies for Rating Votes

-- Policy for reading votes (everyone can read)
CREATE POLICY "Everyone can read rating votes" ON public.rating_votes
  FOR SELECT USING (true);

-- Policy for inserting votes (authenticated users only)
CREATE POLICY "Authenticated users can vote" ON public.rating_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for deleting votes (users can remove their own vote)
CREATE POLICY "Users can remove their own vote" ON public.rating_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Update existing ratings to have default values for new columns (copy main rating)
UPDATE public.ratings 
SET 
  rating_condition = COALESCE(rating_condition, rating),
  rating_communication = COALESCE(rating_communication, rating),
  rating_value = COALESCE(rating_value, rating),
  rating_accuracy = COALESCE(rating_accuracy, rating)
WHERE rating_condition IS NULL OR rating_communication IS NULL OR rating_value IS NULL OR rating_accuracy IS NULL;
