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

-- Private wedding-day operations. These records are never public.
create table if not exists public.wedding_vendors (
  id uuid primary key default gen_random_uuid(), name text not null,
  category text not null default 'Autre', contact_name text not null default '',
  phone text not null default '', email text not null default '', website text not null default '',
  address text not null default '', arrival_time text not null default '', departure_time text not null default '',
  responsibilities text not null default '', notes text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.wedding_moment_vendors (
  moment_id text not null, vendor_id uuid not null references public.wedding_vendors(id) on delete cascade,
  role text not null default '', arrival_time text not null default '', departure_time text not null default '', notes text not null default '',
  primary key (moment_id, vendor_id)
);
create table if not exists public.wedding_documents (
  id uuid primary key default gen_random_uuid(), vendor_id uuid references public.wedding_vendors(id) on delete cascade,
  moment_id text, title text not null, document_type text not null default 'autre' check (document_type in ('devis','facture','contrat','assurance','plan','autre')),
  storage_path text, document_url text, amount_cents bigint, issue_date date, due_date date,
  status text not null default 'a_verifier' check (status in ('a_verifier','valide','paye','archive')),
  notes text not null default '', created_at timestamptz not null default now()
);
create table if not exists public.wedding_payments (
  id uuid primary key default gen_random_uuid(), vendor_id uuid references public.wedding_vendors(id) on delete cascade,
  document_id uuid references public.wedding_documents(id) on delete set null, label text not null,
  amount_cents bigint not null default 0 check (amount_cents >= 0), due_date date, paid_at timestamptz,
  method text not null default '', reference text not null default '',
  status text not null default 'a_payer' check (status in ('a_payer','partiel','paye')),
  notes text not null default '', created_at timestamptz not null default now()
);

alter table public.wedding_vendors enable row level security;
alter table public.wedding_moment_vendors enable row level security;
alter table public.wedding_documents enable row level security;
alter table public.wedding_payments enable row level security;

create policy "Creator only wedding vendors" on public.wedding_vendors for all to authenticated using (lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com') with check (lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com');
create policy "Creator only wedding moment vendors" on public.wedding_moment_vendors for all to authenticated using (lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com') with check (lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com');
create policy "Creator only wedding documents" on public.wedding_documents for all to authenticated using (lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com') with check (lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com');
create policy "Creator only wedding payments" on public.wedding_payments for all to authenticated using (lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com') with check (lower(auth.jwt() ->> 'email') = 'matthieu.lecointre@gmail.com');
