create table if not exists public.rating_replies (
  id uuid default gen_random_uuid() primary key,
  rating_id uuid references public.ratings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  reply_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.rating_replies enable row level security;

-- Policies
create policy "Public replies are viewable by everyone"
  on public.rating_replies for select
  using ( true );

create policy "Authenticated users can insert replies"
  on public.rating_replies for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own replies"
  on public.rating_replies for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own replies"
  on public.rating_replies for delete
  using ( auth.uid() = user_id );
