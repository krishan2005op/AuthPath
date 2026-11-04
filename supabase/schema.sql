-- Run this in the Supabase SQL editor to create the persistent guide store.
create table if not exists public.guides (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  origin text not null default 'generated' check (origin in ('starter', 'generated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guides_name_search_idx on public.guides using gin (to_tsvector('simple', name));
alter table public.guides enable row level security;
grant all on table public.guides to service_role;

create or replace function public.set_guide_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guides_set_updated_at on public.guides;
create trigger guides_set_updated_at
before update on public.guides
for each row execute function public.set_guide_updated_at();

-- No anon/authenticated policies are added. Server routes use the service role
-- key, which must stay server-side and bypasses RLS.
