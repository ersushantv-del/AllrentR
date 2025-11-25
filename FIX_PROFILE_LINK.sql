-- Fix the link between comments and user profiles
-- Run this in Supabase SQL Editor

-- 1. Add a foreign key to the profiles table
-- This allows the website to fetch the user's name and avatar with the comment
ALTER TABLE public.blog_comments
DROP CONSTRAINT IF EXISTS blog_comments_user_id_fkey, -- Drop the old constraint to auth.users if needed (optional, usually fine to keep both or just one)
ADD CONSTRAINT blog_comments_user_id_fkey_profiles
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 2. Ensure RLS allows reading profiles (just in case)
CREATE POLICY "Public can view profiles" ON public.profiles
FOR SELECT USING (true);
-- (This might fail if policy already exists, which is fine)
