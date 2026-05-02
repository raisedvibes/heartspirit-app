create table if not exists public.energy_section_settings (
  section_key text primary key,
  title text,
  subtitle text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.energy_section_settings (section_key, title, subtitle, is_active)
values ('custom', 'Heart Practices', null, true)
on conflict (section_key) do nothing;
