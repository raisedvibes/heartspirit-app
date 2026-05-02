-- If the Custom Energy section metadata exists in the DB but the mobile app never loads it,
-- RLS may be blocking SELECT for the anon/authenticated Supabase roles.
-- Run in the Supabase SQL editor after reviewing your existing policies.

alter table public.energy_section_settings enable row level security;

drop policy if exists "energy_section_settings_select_public" on public.energy_section_settings;

create policy "energy_section_settings_select_public"
on public.energy_section_settings
for select
to anon, authenticated
using (true);
