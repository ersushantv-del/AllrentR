-- Create blog_comments table
CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES blog_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  likes_count integer DEFAULT 0,
  dislikes_count integer DEFAULT 0,
  is_flagged boolean DEFAULT false,
  flag_reason text,
  status text DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'removed'))
);

-- Create blog_comment_votes table for tracking likes/dislikes
CREATE TABLE IF NOT EXISTS blog_comment_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid REFERENCES blog_comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type text CHECK (vote_type IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comment_votes ENABLE ROW LEVEL SECURITY;

-- Policies for blog_comments
CREATE POLICY "Public can read published comments" ON blog_comments
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can create comments" ON blog_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON blog_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON blog_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for blog_comment_votes
CREATE POLICY "Public can read votes" ON blog_comment_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON blog_comment_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote" ON blog_comment_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote" ON blog_comment_votes
  FOR DELETE USING (auth.uid() = user_id);
