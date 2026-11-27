create table if not exists public.user_content (
  user_id uuid primary key references auth.users(id) on delete cascade,
  book_edits jsonb not null default '{}'::jsonb,
  wedding_timeline jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_content enable row level security;

create policy "Users can read their own content"
  on public.user_content for select using (auth.uid() = user_id);
create policy "Users can insert their own content"
  on public.user_content for insert with check (auth.uid() = user_id);
create policy "Users can update their own content"
  on public.user_content for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
