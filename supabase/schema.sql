-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Table: cabin
create table if not exists public.cabin (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  headline text,
  description text,
  nightly_rate numeric not null check (nightly_rate > 0),
  jacuzzi_rate numeric not null default 0,
  max_guests integer not null check (max_guests > 0),
  area_m2 integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Table: cabin_image
create table if not exists public.cabin_image (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid references public.cabin(id) on delete cascade,
  url text not null,
  caption text,
  position integer default 0,
  created_at timestamptz not null default now()
);

-- Table: price_calendar
create table if not exists public.price_calendar (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid references public.cabin(id) on delete cascade,
  cabin_slug text not null references public.cabin(slug) on delete cascade,
  date date not null,
  nightly_rate numeric not null check (nightly_rate > 0),
  created_at timestamptz not null default now(),
  unique (cabin_id, date)
);

create type booking_status as enum (
  'draft',
  'hold',
  'pending',
  'paid',
  'canceled',
  'expired'
);

-- Table: booking
create table if not exists public.booking (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid not null references public.cabin(id),
  cabin_slug text not null references public.cabin(slug),
  user_id uuid references auth.users(id),
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  party_size integer not null check (party_size > 0),
  include_jacuzzi boolean not null default false,
  start_date date not null,
  end_date date not null,
  amount_total numeric not null check (amount_total >= 0),
  amount_breakdown jsonb,
  status booking_status not null default 'hold',
  currency text not null default 'CLP',
  expires_at timestamptz,
  flow_order_id text,
  flow_token text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Table: admin_block
create table if not exists public.admin_block (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid not null references public.cabin(id) on delete cascade,
  cabin_slug text not null references public.cabin(slug) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Table: user (role)
create table if not exists public."user" (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'guest' check (role in ('guest', 'admin')),
  created_at timestamptz not null default now()
);

-- Helper function to check admin role
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public."user"
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- Row Level Security
alter table public.cabin enable row level security;
alter table public.cabin_image enable row level security;
alter table public.price_calendar enable row level security;
alter table public.admin_block enable row level security;
alter table public.booking enable row level security;
alter table public."user" enable row level security;

-- Public read-only access to marketing data
create policy "Cabins visible" on public.cabin
  for select
  using (true);

create policy "Cabin images visible" on public.cabin_image
  for select
  using (true);

create policy "Price calendar visible" on public.price_calendar
  for select
  using (true);

create policy "Admin blocks visible" on public.admin_block
  for select
  using (true);

-- Bookings policies
create policy "Users see own bookings"
  on public.booking
  for select
  using (
    auth.uid() = user_id
    or guest_email = auth.email()
  );

create policy "Admins manage bookings"
  on public.booking
  using (public.is_admin());

-- User table policies
create policy "Users read self"
  on public."user"
  for select
  using (auth.uid() = id);

create policy "Admins manage users"
  on public."user"
  using (public.is_admin());
