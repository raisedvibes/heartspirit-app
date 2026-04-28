create extension if not exists pgcrypto;

create table if not exists public.weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'This week',
  reflection text not null,
  week_start date null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.weekly_reflections enable row level security;

drop policy if exists "Anyone can read active weekly reflections" on public.weekly_reflections;
create policy "Anyone can read active weekly reflections"
on public.weekly_reflections
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Service role can manage weekly reflections" on public.weekly_reflections;
create policy "Service role can manage weekly reflections"
on public.weekly_reflections
for all
to service_role
using (true)
with check (true);

create index if not exists idx_weekly_reflections_active_created
  on public.weekly_reflections (is_active, created_at desc);

create or replace function public.set_updated_at_weekly_reflections()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_weekly_reflections_updated_at on public.weekly_reflections;

create trigger trg_weekly_reflections_updated_at
before update on public.weekly_reflections
for each row
execute function public.set_updated_at_weekly_reflections();