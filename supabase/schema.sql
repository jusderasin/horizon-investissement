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

-- Private Telegram pairing. Only the server service role reads pairing tokens and chat IDs.
create table if not exists public.telegram_pairing_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.telegram_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chat_id text not null unique,
  telegram_username text,
  active boolean not null default true,
  connected_at timestamptz not null default now()
);

create table if not exists public.market_alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('macro', 'central_bank', 'geopolitics', 'company', 'markets', 'crypto', 'social')),
  importance integer not null check (importance between 50 and 100),
  title text not null,
  summary text not null,
  source_name text not null,
  source_url text,
  symbols text[] not null default '{}',
  test boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.market_alerts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  channel text not null check (channel in ('telegram', 'discord', 'in_app')),
  status text not null check (status in ('delivered', 'failed', 'queued')),
  created_at timestamptz not null default now()
);

alter table public.telegram_pairing_tokens enable row level security;
alter table public.telegram_connections enable row level security;
alter table public.market_alerts enable row level security;
alter table public.alert_deliveries enable row level security;

create policy "Users see their Telegram connection" on public.telegram_connections for select using ((select auth.uid()) = user_id);
create policy "Users see their own deliveries" on public.alert_deliveries for select using ((select auth.uid()) = user_id);
create policy "Users read published alerts" on public.market_alerts for select using ((select auth.uid()) is not null);
