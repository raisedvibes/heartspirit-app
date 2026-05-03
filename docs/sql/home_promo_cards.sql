-- Optional admin-controlled promo/offering card for mobile Home (below Circles).
-- Run in Supabase SQL editor or via migration tooling.

create extension if not exists pgcrypto;

create table if not exists public.home_promo_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  button_label text null,
  url text null,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.home_promo_cards enable row level security;

drop policy if exists "Anyone can read active home promo cards" on public.home_promo_cards;
create policy "Anyone can read active home promo cards"
on public.home_promo_cards
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Service role can manage home promo cards" on public.home_promo_cards;
create policy "Service role can manage home promo cards"
on public.home_promo_cards
for all
to service_role
using (true)
with check (true);

create index if not exists idx_home_promo_cards_active_sort_created
  on public.home_promo_cards (is_active, sort_order asc, created_at desc);

create or replace function public.set_updated_at_home_promo_cards()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_home_promo_cards_updated_at on public.home_promo_cards;

create trigger trg_home_promo_cards_updated_at
before update on public.home_promo_cards
for each row
execute function public.set_updated_at_home_promo_cards();
