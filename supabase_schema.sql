-- =========================================
-- IMOBIPRO SAAS — SCHEMA FINAL COMPATÍVEL
-- =========================================

create extension if not exists "uuid-ossp";

-- =========================
-- TABELAS
-- =========================

create table if not exists public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  user_id uuid primary key, -- auth.users.id
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'corretor',
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan text not null check (plan in ('trial','basico','profissional')),
  status text not null check (status in ('trial','active','expired','canceled')),
  trial_end timestamptz,
  mp_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  price numeric,
  city text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.site_settings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  slug text not null unique,
  business_name text,
  whatsapp text,
  primary_color text default '#2563eb',
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================
-- TRIGGERS
-- =========================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_subscriptions_updated
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger trg_properties_updated
before update on public.properties
for each row execute function public.set_updated_at();

create trigger trg_site_settings_updated
before update on public.site_settings
for each row execute function public.set_updated_at();

-- =========================
-- RLS
-- =========================

alter table tenants enable row level security;
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table properties enable row level security;
alter table site_settings enable row level security;

-- =========================
-- POLICIES (AGORA CORRETAS)
-- =========================

-- TENANTS
drop policy if exists tenant_read on tenants;
create policy tenant_read
on tenants
for select
using (
  id in (
    select tenant_id
    from profiles
    where user_id = auth.uid()
  )
);

-- PROFILES
drop policy if exists profile_read on profiles;
create policy profile_read
on profiles
for select
using (user_id = auth.uid());

-- SUBSCRIPTIONS
drop policy if exists subscription_read on subscriptions;
create policy subscription_read
on subscriptions
for select
using (
  tenant_id in (
    select tenant_id
    from profiles
    where user_id = auth.uid()
  )
);

-- PROPERTIES (CRUD)
drop policy if exists properties_access on properties;
create policy properties_access
on properties
for all
using (
  tenant_id in (
    select tenant_id
    from profiles
    where user_id = auth.uid()
  )
)
with check (
  tenant_id in (
    select tenant_id
    from profiles
    where user_id = auth.uid()
  )
);

-- SITE SETTINGS (PRIVADO)
drop policy if exists site_settings_owner on site_settings;
create policy site_settings_owner
on site_settings
for all
using (
  tenant_id in (
    select tenant_id
    from profiles
    where user_id = auth.uid()
  )
);

-- SITE SETTINGS (PÚBLICO)
drop policy if exists site_settings_public on site_settings;
create policy site_settings_public
on site_settings
for select
to anon
using (true);

-- PROPERTIES (PÚBLICO)
drop policy if exists properties_public on properties;
create policy properties_public
on properties
for select
to anon
using (status = 'active');

