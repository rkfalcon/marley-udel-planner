create table if not exists public.catalog_sync (
  id text primary key check (id = 'udel'),
  state jsonb not null default '{}',
  lease_token uuid,
  lease_until timestamptz
);
create table if not exists public.catalog_versions (
  id uuid primary key,
  source jsonb not null,
  courses jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.catalog_sync enable row level security;
alter table public.catalog_versions enable row level security;
revoke all on public.catalog_sync, public.catalog_versions from anon, authenticated;
grant all on public.catalog_sync, public.catalog_versions to service_role;
insert into public.catalog_sync(id) values ('udel') on conflict do nothing;
create or replace function public.claim_catalog_sync(token uuid)
returns setof public.catalog_sync language sql security invoker set search_path = public as $$
  update public.catalog_sync set lease_token = token, lease_until = now() + interval '6 minutes'
  where id = 'udel' and (lease_until is null or lease_until < now()) returning *;
$$;
revoke all on function public.claim_catalog_sync(uuid) from public, anon, authenticated;
grant execute on function public.claim_catalog_sync(uuid) to service_role;
