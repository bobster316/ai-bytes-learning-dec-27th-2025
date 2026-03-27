create table if not exists public.cache_entries (
  key text primary key,
  value jsonb not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

create index if not exists cache_entries_expires_at_idx on public.cache_entries(expires_at);

alter table public.cache_entries enable row level security;

create policy "Allow service role full access" on public.cache_entries
  for all
  to service_role
  using (true)
  with check (true);
