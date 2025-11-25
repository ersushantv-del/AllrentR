-- 1. Create the blog_comments table
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id uuid REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  likes_count integer DEFAULT 0,
  dislikes_count integer DEFAULT 0,
  is_flagged boolean DEFAULT false,
  flag_reason text,
  status text DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'removed'))
);

-- 2. Create the blog_comment_votes table
CREATE TABLE IF NOT EXISTS public.blog_comment_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type text CHECK (vote_type IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- 3. Enable Security (RLS)
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comment_votes ENABLE ROW LEVEL SECURITY;

-- 4. Create Access Policies (Permissions)

-- Allow everyone to read published comments
CREATE POLICY "Public can read published comments" ON public.blog_comments
  FOR SELECT USING (status = 'published');

-- Allow logged-in users to post comments
CREATE POLICY "Authenticated users can create comments" ON public.blog_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to edit their own comments
CREATE POLICY "Users can update their own comments" ON public.blog_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.blog_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Allow everyone to see votes (likes/dislikes)
CREATE POLICY "Public can read votes" ON public.blog_comment_votes
  FOR SELECT USING (true);

-- Allow logged-in users to vote
CREATE POLICY "Authenticated users can vote" ON public.blog_comment_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to change their vote
CREATE POLICY "Users can change their vote" ON public.blog_comment_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to remove their vote
CREATE POLICY "Users can remove their vote" ON public.blog_comment_votes
  FOR DELETE USING (auth.uid() = user_id);
