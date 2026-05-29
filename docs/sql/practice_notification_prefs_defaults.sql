-- Practice update push prefs: default ON for new rows; backfill unset (NULL) only.
-- Does NOT change rows where a user explicitly set false.

alter table public.profiles
  add column if not exists notif_practice_updates boolean default true;

alter table public.profiles
  alter column notif_practice_updates set default true;

update public.profiles
set
  notif_practice_updates = true
where notif_practice_updates is null;
