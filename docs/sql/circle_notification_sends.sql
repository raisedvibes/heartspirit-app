-- Run in Supabase SQL editor before enabling circle notifications.
create extension if not exists pgcrypto;

create table if not exists public.circle_notification_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  circle_id uuid not null,
  kind text not null,
  scheduled_for timestamptz,
  sent_at timestamptz not null default now(),
  payload_hash text,
  created_at timestamptz not null default now()
);

create unique index if not exists circle_notification_sends_unique_schedule
  on public.circle_notification_sends (user_id, circle_id, kind, scheduled_for)
  where scheduled_for is not null;

create unique index if not exists circle_notification_sends_unique_payload
  on public.circle_notification_sends (user_id, circle_id, kind, payload_hash)
  where payload_hash is not null;

create index if not exists circle_notification_sends_circle_idx
  on public.circle_notification_sends (circle_id, kind, created_at desc);
