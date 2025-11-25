-- Create blog_comments table
CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES blog_comments(id) ON DELETE CASCADE,
  status text DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'removed')),
  likes_count integer DEFAULT 0,
  dislikes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blog_comment_votes table
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

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Everyone can view published comments" ON blog_comments;
DROP POLICY IF EXISTS "Users can insert comments" ON blog_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON blog_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON blog_comments;
DROP POLICY IF EXISTS "Everyone can view votes" ON blog_comment_votes;
DROP POLICY IF EXISTS "Users can insert votes" ON blog_comment_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON blog_comment_votes;

-- Policies for blog_comments

-- Allow everyone to view published comments
CREATE POLICY "Everyone can view published comments" ON blog_comments
  FOR SELECT USING (status = 'published');

-- Allow authenticated users to insert comments
CREATE POLICY "Users can insert comments" ON blog_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" ON blog_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON blog_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for blog_comment_votes

-- Allow everyone to view votes
CREATE POLICY "Everyone can view votes" ON blog_comment_votes
  FOR SELECT USING (true);

-- Allow authenticated users to insert votes
CREATE POLICY "Users can insert votes" ON blog_comment_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own votes
CREATE POLICY "Users can delete their own votes" ON blog_comment_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update comment vote counts
CREATE OR REPLACE FUNCTION update_comment_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'like' THEN
      UPDATE blog_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    ELSIF NEW.vote_type = 'dislike' THEN
      UPDATE blog_comments SET dislikes_count = dislikes_count + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'like' THEN
      UPDATE blog_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
    ELSIF OLD.vote_type = 'dislike' THEN
      UPDATE blog_comments SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'like' THEN
      UPDATE blog_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
    ELSIF OLD.vote_type = 'dislike' THEN
      UPDATE blog_comments SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.comment_id;
    END IF;
    IF NEW.vote_type = 'like' THEN
      UPDATE blog_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    ELSIF NEW.vote_type = 'dislike' THEN
      UPDATE blog_comments SET dislikes_count = dislikes_count + 1 WHERE id = NEW.comment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote count updates
DROP TRIGGER IF EXISTS blog_comment_votes_trigger ON blog_comment_votes;
CREATE TRIGGER blog_comment_votes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON blog_comment_votes
  FOR EACH ROW EXECUTE FUNCTION update_comment_vote_counts();
