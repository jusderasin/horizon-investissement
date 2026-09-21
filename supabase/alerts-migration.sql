-- Horizon notification engine: run once in Supabase SQL Editor.
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

drop policy if exists "Users see their Telegram connection" on public.telegram_connections;
drop policy if exists "Users see their own deliveries" on public.alert_deliveries;
drop policy if exists "Users read published alerts" on public.market_alerts;
create policy "Users see their Telegram connection" on public.telegram_connections for select using ((select auth.uid()) = user_id);
create policy "Users see their own deliveries" on public.alert_deliveries for select using ((select auth.uid()) = user_id);
create policy "Users read published alerts" on public.market_alerts for select using ((select auth.uid()) is not null);
