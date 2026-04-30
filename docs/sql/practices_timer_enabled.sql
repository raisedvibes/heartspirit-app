-- Run in Supabase SQL editor: add optional admin control to show/hide the practice timer in the app.
alter table public.practices
  add column if not exists timer_enabled boolean not null default true;

-- Existing rows receive default true; optional explicit backfill if the column pre-existed as null:
update public.practices
set timer_enabled = true
where timer_enabled is null;
