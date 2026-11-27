create table if not exists public.user_content (
  user_id uuid primary key references auth.users(id) on delete cascade,
  book_edits jsonb not null default '{}'::jsonb,
  wedding_timeline jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_content enable row level security;

drop policy if exists "Users can read their own content" on public.user_content;
drop policy if exists "Users can insert their own content" on public.user_content;
drop policy if exists "Users can update their own content" on public.user_content;

create policy "Creator can read content"
  on public.user_content for select using (auth.uid() = user_id);
create policy "Creator can insert content"
  on public.user_content for insert with check (
    auth.uid() = user_id and lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com'
  );
create policy "Creator can update content"
  on public.user_content for update using (
    auth.uid() = user_id and lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com'
  ) with check (
    auth.uid() = user_id and lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com'
  );
