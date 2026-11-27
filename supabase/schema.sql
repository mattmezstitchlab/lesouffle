create table if not exists public.site_content (
  id text primary key default 'main' check (id = 'main'),
  book_edits jsonb not null default '{}'::jsonb,
  wedding_timeline jsonb not null default '[]'::jsonb,
  program_events jsonb not null default '[]'::jsonb,
  program_providers jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
drop policy if exists "Creator can insert site content" on public.site_content;
drop policy if exists "Creator can update site content" on public.site_content;

create policy "Public can read site content"
  on public.site_content for select using (true);
create policy "Creator can insert site content"
  on public.site_content for insert with check (
    lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com'
  );
create policy "Creator can update site content"
  on public.site_content for update using (
    lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com'
  ) with check (
    lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com'
  );
