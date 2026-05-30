-- Allow circles.frequency to be NULL ("None" in admin = no frequency label on cards).
-- Run in Supabase SQL Editor (or via migration tooling).

ALTER TABLE public.circles
  ALTER COLUMN frequency DROP NOT NULL;
