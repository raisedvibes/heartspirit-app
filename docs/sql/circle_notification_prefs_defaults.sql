-- Circle in-app reminder prefs: default ON for new rows; backfill unset (NULL) only.
-- Does NOT change rows where a user explicitly set false.

alter table public.profiles
  alter column notif_circles_week_before set default true;

alter table public.profiles
  alter column notif_circles_day_before set default true;

update public.profiles
set
  notif_circles_week_before = true
where notif_circles_week_before is null;

update public.profiles
set
  notif_circles_day_before = true
where notif_circles_day_before is null;
