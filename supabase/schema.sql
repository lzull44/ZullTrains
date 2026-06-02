-- ZullCoaching — Supabase schema + Row Level Security.
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- It maps the in-app demo data to real tables. Coaches see all clients;
-- each client can only read/write their own rows.

-- ---------- profiles (one row per auth user: coach or client) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'client' check (role in ('coach', 'client')),
  full_name   text,
  email       text,
  avatar_url  text,
  instagram   text,
  bio         text,
  created_at  timestamptz not null default now()
);

-- intake + coaching details for clients
create table if not exists public.client_profiles (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  age            int,
  height_cm      numeric,
  weight_kg      numeric,
  goal           text,
  activity_level text,
  calories       int,
  protein        int,
  carbs          int,
  fat            int,
  step_goal      int,
  cardio_goal    int,
  sleep_goal     numeric,
  water_goal     numeric,
  notes          text,
  coach_comments text,
  joined         date default now()
);

-- coach-assigned plan: meal plan, macro targets, workout split (JSON blobs)
create table if not exists public.plans (
  user_id  uuid primary key references public.profiles (id) on delete cascade,
  meals    jsonb default '[]',
  targets  jsonb default '{}',
  workout  jsonb default '[]',
  updated_at timestamptz not null default now()
);

-- 1:1 messages between coach and a client
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  client_id  uuid not null references public.profiles (id) on delete cascade,
  sender     text not null check (sender in ('coach', 'client')),
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_client_idx on public.messages (client_id, created_at);

-- daily self-logging (one row per client per day)
create table if not exists public.daily_logs (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  log_date  date not null,
  weight    numeric,
  steps     int,
  water     numeric,
  sleep     numeric,
  unique (user_id, log_date)
);

-- progress photos (files live in the 'progress-photos' Storage bucket)
create table if not exists public.progress_photos (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  label       text,
  created_at  timestamptz not null default now()
);

-- active subscriptions (kept in sync by the Stripe webhook)
create table if not exists public.subscriptions (
  user_id               uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id    text,
  stripe_subscription_id text,
  package_id            text,
  status                text,
  current_period_end    timestamptz,
  updated_at            timestamptz not null default now()
);

-- ---------- helper: is the current user a coach? ----------
create or replace function public.is_coach()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'coach');
$$;

-- ---------- enable RLS ----------
alter table public.profiles        enable row level security;
alter table public.client_profiles enable row level security;
alter table public.plans           enable row level security;
alter table public.messages        enable row level security;
alter table public.daily_logs      enable row level security;
alter table public.progress_photos enable row level security;
alter table public.subscriptions   enable row level security;

-- Owners manage their own row; coaches can read/write everything.
-- profiles
create policy "own profile read"  on public.profiles for select using (id = auth.uid() or public.is_coach());
create policy "own profile write" on public.profiles for update using (id = auth.uid());
create policy "insert own profile" on public.profiles for insert with check (id = auth.uid());
create policy "coach can delete profile" on public.profiles for delete using (public.is_coach());

-- generic owner-or-coach policy applied to the client-data tables
do $$
declare t text;
begin
  foreach t in array array['client_profiles','plans','daily_logs','progress_photos','subscriptions']
  loop
    execute format('create policy "owner or coach read" on public.%I for select using (user_id = auth.uid() or public.is_coach());', t);
    execute format('create policy "owner or coach write" on public.%I for all using (user_id = auth.uid() or public.is_coach()) with check (user_id = auth.uid() or public.is_coach());', t);
  end loop;
end $$;

-- messages: the client in the thread, or any coach
create policy "thread read"  on public.messages for select using (client_id = auth.uid() or public.is_coach());
create policy "thread write" on public.messages for insert with check (
  (sender = 'client' and client_id = auth.uid()) or (sender = 'coach' and public.is_coach())
);
create policy "coach can delete messages" on public.messages for delete using (public.is_coach());

-- ---------- auto-create a profile row on signup ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), 'client')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- leads (public discovery-call applications) ----------
create table if not exists public.leads (
  id             bigint generated always as identity primary key,
  name           text not null,
  email          text not null,
  phone          text,
  goal           text,
  timeline       text,
  preferred_time text,
  notes          text,
  source         text,
  status         text default 'new',
  created_at     timestamptz not null default now()
);
alter table public.leads enable row level security;
-- Anonymous visitors can submit a lead through the /apply form.
create policy "anyone can submit a lead" on public.leads for insert with check (true);
-- Only coaches can read / update / delete leads.
create policy "coach can read leads"   on public.leads for select using (public.is_coach());
create policy "coach can update leads" on public.leads for update using (public.is_coach()) with check (public.is_coach());
create policy "coach can delete leads" on public.leads for delete using (public.is_coach());

-- Storage: create a private bucket named 'progress-photos' in the dashboard,
-- then add policies so users manage their own folder (path = {user_id}/...).
