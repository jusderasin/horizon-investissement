-- Execute in Supabase SQL Editor after creating the project.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  risk_profile text not null default 'Modéré',
  excluded_sectors text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alert_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  score_threshold integer not null default 75 check (score_threshold between 50 and 95),
  discord_enabled boolean not null default false,
  telegram_enabled boolean not null default false,
  in_app_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.alert_preferences enable row level security;
create policy "Users manage their own profile" on public.profiles for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users manage their own alerts" on public.alert_preferences for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
